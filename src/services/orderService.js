import { ORDER_REPOSITORY } from '#repositories/orderRepository.js'
import { PAYMENT_REPOSITORY } from '#repositories/paymentRepository.js'
import { CART_SERVICE } from '#services/cartService.js'
import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { ORDER_STATUS, DELIVERY_STATUS, SHIPPING_FEE } from '#constants/orderConstant.js'
import { PAYMENT_METHODS, PAYMENT_STATUS, PAYMENT_PROVIDERS } from '#constants/paymentConstant.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { pricingModel } from '#models/pricingModel.js'
import crypto from 'crypto'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { SERVICE_ITEM_SERVICE } from '#services/serviceItemService.js'
import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'
import { INVENTORY_SERVICE } from '#services/inventoryService.js'
import { RoleEnum } from '#constants/roleConstant.js'
import mongoose from 'mongoose'

/**
 * Map Cloudinary images for all products in an order's items.
 * Without this, item.product.images is a raw string[] of publicIds with no URLs.
 */
const mapOrderProductImages = (order) => {
  if (!order) return order
  const orderObj = order.toObject ? order.toObject() : order
  const mappedItems = (orderObj.items || []).map((item) => {
    if (item.product && typeof item.product === 'object') {
      const mappedProduct = PRODUCT_SERVICE.mapProductImages(item.product)
      return { ...item, product: mappedProduct }
    }
    return item
  })

  // Expose paymentStatus explicitly for frontend convenience.
  // Source of truth remains payment.status (orderStatus and paymentStatus are separate).
  const rawPaymentStatus = orderObj?.payment?.status || PAYMENT_STATUS.PENDING
  const paymentStatus = rawPaymentStatus
  const orderStatus = orderObj?.orderStatus
  const deliveryStatus = orderObj?.delivery?.status

  // Backfill legacy data for response consistency:
  // If order is cancelled but delivery still shows pending/shipping, expose delivery as cancelled.
  const shouldForceDeliveryCancelled = orderStatus === ORDER_STATUS.CANCELLED &&
    deliveryStatus &&
    (deliveryStatus === DELIVERY_STATUS.PENDING || deliveryStatus === DELIVERY_STATUS.SHIPPING)

  return {
    ...orderObj,
    orderStatus,
    items: mappedItems,
    paymentStatus,
    delivery: orderObj?.delivery
      ? {
        ...orderObj.delivery,
        status: shouldForceDeliveryCancelled ? DELIVERY_STATUS.CANCELLED : deliveryStatus
      }
      : orderObj?.delivery
  }
}

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `ORD-${timestamp}-${random}`
}

const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

const ensureCodPaymentExists = async (order, { status = PAYMENT_STATUS.PENDING, paidAt = null } = {}) => {
  if (!order) return null
  if (order.paymentMethod !== PAYMENT_METHODS.COD) return null

  const orderUserId = order?.user?._id || order.user

  let payment = await PAYMENT_REPOSITORY.findByOrderId(order._id, false)
  if (!payment) {
    payment = await PAYMENT_REPOSITORY.createPayment({
      order: order._id,
      user: orderUserId,
      method: PAYMENT_METHODS.COD,
      provider: PAYMENT_PROVIDERS.COD,
      amount: order.totalAmount,
      currency: 'VND',
      status,
      transactionId: generateTransactionId('COD'),
      paidAt: status === PAYMENT_STATUS.SUCCESS ? (paidAt || new Date()) : null
    })

    return payment
  }

  // If payment exists, optionally update it to the desired state
  if (status === PAYMENT_STATUS.SUCCESS && payment.status !== PAYMENT_STATUS.SUCCESS) {
    payment.status = PAYMENT_STATUS.SUCCESS
    payment.paidAt = paidAt || new Date()
    payment.failureReason = ''
    await PAYMENT_REPOSITORY.savePayment(payment)
  }

  return payment
}

/**
 * Calculate pricing discounts for products
 */
const calculatePricingDiscounts = async (items) => {
  const pricingApplied = []

  for (const item of items) {
    const productId = item.product._id || item.product

    // Find applicable pricing rules for this product
    const pricingRules = await pricingModel
      .find({
        product: productId,
        isActive: true,
        $or: [
          { minQuantity: { $lte: item.quantity }, maxQuantity: { $gte: item.quantity } },
          { minQuantity: { $lte: item.quantity }, maxQuantity: null }
        ]
      })
      .sort({ minQuantity: -1 })
      .limit(1)

    if (pricingRules.length > 0) {
      const rule = pricingRules[0]
      const discountAmount = (item.price * item.quantity * rule.discountPercentage) / 100

      pricingApplied.push({
        product: productId,
        minQuantity: rule.minQuantity,
        maxQuantity: rule.maxQuantity,
        discountPercentage: rule.discountPercentage,
        discountAmount: discountAmount
      })
    }
  }

  return pricingApplied
}

const calculateTotalDiscount = (pricingApplied) => {
  return pricingApplied.reduce((sum, pricing) => sum + (pricing.discountAmount || 0), 0)
}

/**
 * Calculate order totals
 */
const calculateOrderTotals = (items, pricingApplied, shippingFee = 0) => {
  let subtotal = 0

  for (const item of items) {
    const productTotal = item.price * item.quantity
    const servicesTotal = item.services.reduce((sum, service) => sum + service.price * item.quantity, 0)
    subtotal += productTotal + servicesTotal
  }

  const totalDiscount = calculateTotalDiscount(pricingApplied)
  const totalAmount = subtotal - totalDiscount + shippingFee

  return { subtotal, totalAmount }
}

const normalizeLocation = (value) => {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const isInterProvince = (shippingAddress, branchAddress) => {
  const city = normalizeLocation(shippingAddress?.city)
  const address = normalizeLocation(branchAddress)

  if (!city || !address) {
    return true
  }

  return !address.includes(city)
}

const calculateShippingFee = async (shippingAddress, branchId) => {
  if (!shippingAddress || !branchId) {
    return SHIPPING_FEE.INTER_PROVINCE
  }

  const branch = await BRANCH_REPOSITORY.getBranchById(branchId)
  const branchAddress = branch?.address || ''
  const isInter = isInterProvince(shippingAddress, branchAddress)
  return isInter ? SHIPPING_FEE.INTER_PROVINCE : SHIPPING_FEE.INTRA_PROVINCE
}

/**
 * Find a branch that can fulfill ALL items in the order.
 * Returns null when no single branch can satisfy the full order.
 */
const findBranchWithStock = async (items) => {
  // Fetch inventories for every product up front
  const inventoriesByProduct = await Promise.all(
    items.map(async (item) => {
      const productId = item.product._id || item.product
      const invs = await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(productId)
      return { productName: item.product.name || 'Unknown', requiredQty: item.quantity, invs }
    })
  )

  // Build a set of branch IDs that have enough stock for every product
  // Start from the first product's eligible branches and intersect with others
  const eligibleBranchIds = inventoriesByProduct.reduce((eligible, { requiredQty, invs }) => {
    const branchesWithEnough = invs
      .filter(inv => inv.quantity >= requiredQty)
      .map(inv => inv.branch._id.toString())

    if (branchesWithEnough.length === 0) {
      return new Set()
    }

    if (eligible === null) return new Set(branchesWithEnough)
    return new Set(branchesWithEnough.filter(id => eligible.has(id)))
  }, null)

  if (!eligibleBranchIds || eligibleBranchIds.size === 0) {
    return null
  }

  // Return the first eligible branch's actual _id (ObjectId)
  const selectedBranchId = [...eligibleBranchIds][0]
  const firstInv = inventoriesByProduct[0].invs.find(inv => inv.branch._id.toString() === selectedBranchId)
  return firstInv?.branch._id || selectedBranchId
}

/**
 * Check whether main inventory can fulfill all items.
 */
const canFulfillFromMainInventory = async (items) => {
  for (const item of items) {
    const productId = item.product._id || item.product

    let mainInventory = null
    try {
      mainInventory = await INVENTORY_SERVICE.getInventoryByProductId(productId)
    } catch (error) {
      if (error?.code === ERROR_CODES.NOT_FOUND.code) {
        return false
      }
      throw error
    }

    if (!mainInventory || mainInventory.quantity < item.quantity) {
      return false
    }
  }

  return true
}

/**
 * Decrease main inventory for all items.
 */
const decreaseMainInventoryForOrder = async (items) => {
  await INVENTORY_SERVICE.decreaseInventoryOnOrderCreation(
    items.map((item) => ({
      product: item.product._id || item.product,
      quantity: item.quantity
    }))
  )
}

/**
 * Decrease inventory for all items
 */
const decreaseInventoryForOrder = async (branchId, items) => {
  for (const item of items) {
    const productId = item.product._id || item.product
    await STORE_INVENTORY_SERVICE.decreaseStoreInventoryOnSale(branchId, productId, item.quantity)
  }
}

/**
 * Restore inventory when order is cancelled
 */
const restoreInventoryForOrder = async (order, options = {}) => {
  const { session = null } = options
  if (order.branch) {
    for (const item of order.items) {
      const productId = item.product._id || item.product
      await STORE_INVENTORY_SERVICE.increaseStoreInventory(order.branch, productId, item.quantity, { session })
    }
    return
  }

  await INVENTORY_SERVICE.restoreInventoryOnOrderCancellation(
    order.items.map((item) => ({
      product: item.product._id || item.product,
      quantity: item.quantity
    }))
  )
}

const isTransactionNotSupportedError = (error) => {
  const message = (error?.message || '').toString().toLowerCase()
  return message.includes('transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('illegaloperation') ||
    message.includes('not supported')
}

const runWithOptionalTransaction = async (fn) => {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } catch (error) {
    if (isTransactionNotSupportedError(error)) {
      return await fn(null)
    }
    throw error
  } finally {
    session.endSession()
  }
}

const isOrderCancelled = (status) => {
  return status === ORDER_STATUS.CANCELLED
}

const assertBranchScopedOrderAccess = (order, requester) => {
  const requesterRole = requester?.role
  if (![RoleEnum.STAFF, RoleEnum.MANAGER].includes(requesterRole)) return

  const requesterBranch = requester?.branch
  if (!requesterBranch) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Tài khoản chưa được gán chi nhánh'])
  }

  const orderBranch = order?.branch?._id?.toString?.() || order?.branch?.toString?.() || order?.branch
  if (!orderBranch || orderBranch.toString() !== requesterBranch.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền truy cập đơn hàng của chi nhánh khác'])
  }
}

/**
 * Create order from cart (COD only; VNPay uses payment API)
 */
const createOrder = async (userId, orderData) => {
  const { shippingAddress, paymentMethod, message = '' } = orderData

  // Validate cart and get items
  const cart = await CART_SERVICE.validateCartBeforeCheckout(userId)

  if (!cart || cart.items.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Giỏ hàng đang trống'])
  }

  // Populate cart items to get full product details
  const populatedCart = await CART_SERVICE.getCart(userId)

  // Only COD is allowed for online orders; VNPay uses /api/payments/vnpay/create
  if (paymentMethod !== PAYMENT_METHODS.COD) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng online chỉ hỗ trợ thanh toán COD. Vui lòng sử dụng API /api/payments/vnpay/create để thanh toán qua VNPay'])
  }

  // Calculate pricing discounts
  const pricingApplied = await calculatePricingDiscounts(populatedCart.items)

  // Prefer branch fulfillment; fallback to main inventory when all branches cannot fulfill.
  const selectedBranch = await findBranchWithStock(populatedCart.items)
  const useMainInventory = !selectedBranch

  if (useMainInventory) {
    const canUseMainInventory = await canFulfillFromMainInventory(populatedCart.items)
    if (!canUseMainInventory) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không đủ số lượng trong hệ thống'])
    }
  }

  // Calculate totals (include shipping fee)
  const shippingFee = selectedBranch
    ? await calculateShippingFee(shippingAddress, selectedBranch)
    : SHIPPING_FEE.INTER_PROVINCE
  const { subtotal, totalAmount } = calculateOrderTotals(populatedCart.items, pricingApplied, shippingFee)

  // Generate order number
  const orderNumber = generateOrderNumber()

  // Create order
  const order = await ORDER_REPOSITORY.createOrder({
    orderNumber,
    type: 'online',
    user: userId,
    items: populatedCart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      services: item.services.map(service => ({
        service: service.service._id,
        price: service.price
      }))
    })),
    shippingAddress,
    orderStatus: ORDER_STATUS.PENDING,
    subtotal,
    shippingFee,
    totalAmount,
    pricingApplied,
    paymentMethod,
    delivery: {
      status: DELIVERY_STATUS.PENDING
    },
    message,
    branch: selectedBranch || null,
    createdBy: userId
  })

  // Create COD payment record (so /api/payments/order/:orderId works for COD)
  await ensureCodPaymentExists(order, { status: PAYMENT_STATUS.PENDING })

  // For COD, confirm order and decrease inventory immediately
  if (paymentMethod === PAYMENT_METHODS.COD) {
    await ORDER_REPOSITORY.updateOrderStatus(order._id, ORDER_STATUS.CONFIRMED, userId)

    if (selectedBranch) {
      await decreaseInventoryForOrder(selectedBranch, populatedCart.items)
    } else {
      await decreaseMainInventoryForOrder(populatedCart.items)
    }
  }

  // Clear cart after successful order
  await CART_SERVICE.clearCart(userId)

  // Get populated order
  const populatedOrder = await ORDER_REPOSITORY.getOrderById(order._id)

  // Send confirmation email (don't fail if email fails)
  try {
    await EMAIL_SERVICE.sendOrderConfirmation(
      populatedOrder.user.email,
      populatedOrder.user.fullname,
      populatedOrder
    )
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('Failed to send order confirmation email:', emailError.message)
  }

  return populatedOrder
}

/**
 * Get order by ID
 */
const getOrderById = async (orderId, requester) => {
  const userId = requester?.id
  const userRole = requester?.role
  const order = await ORDER_REPOSITORY.getOrderById(orderId)

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Check permission: user can only view their own orders, admin/staff can view all
  if (userRole === 'customer' && order.user._id.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền xem đơn hàng này'])
  }

  assertBranchScopedOrderAccess(order, requester)

  return mapOrderProductImages(order)
}

/**
 * Get order by order number
 */
const getOrderByOrderNumber = async (orderNumber, requester) => {
  const userId = requester?.id
  const userRole = requester?.role
  const order = await ORDER_REPOSITORY.getOrderByOrderNumber(orderNumber)

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Check permission
  if (userRole === 'customer' && order.user._id.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền xem đơn hàng này'])
  }

  assertBranchScopedOrderAccess(order, requester)

  // Self-heal inconsistent state: refunded payment implies cancelled order at system level.
  if (
    order.paymentMethod === PAYMENT_METHODS.VNPAY &&
    order.payment?.status === PAYMENT_STATUS.REFUNDED &&
    !isOrderCancelled(order.orderStatus)
  ) {
    await ORDER_REPOSITORY.updateOrderById(order._id, {
      orderStatus: ORDER_STATUS.CANCELLED,
      'delivery.status': DELIVERY_STATUS.CANCELLED,
      updatedAt: new Date()
    })
    const updatedOrder = await ORDER_REPOSITORY.getOrderByOrderNumber(orderNumber)
    return mapOrderProductImages(updatedOrder)
  }

  return mapOrderProductImages(order)
}

/**
 * Get user's orders
 */
const getMyOrders = async (userId, query = {}) => {
  const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = query

  const filter = {}
  if (status) {
    filter.orderStatus = status
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const result = await ORDER_REPOSITORY.getOrdersByUser(userId, filter, { page, limit, sort })
  const mappedDocs = result.docs.map(mapOrderProductImages)

  return {
    data: mappedDocs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Get all orders (Admin/Staff)
 */
const getAllOrders = async (query = {}, requester = null) => {
  const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = query

  const filter = {}
  if (status) {
    filter.orderStatus = status
  }

  // Staff/Manager can only see orders in their assigned branch.
  if ([RoleEnum.STAFF, RoleEnum.MANAGER].includes(requester?.role)) {
    const requesterBranch = requester?.branch
    if (!requesterBranch) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, ['Tài khoản chưa được gán chi nhánh'])
    }

    filter.branch = new mongoose.Types.ObjectId(requesterBranch)
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const result = await ORDER_REPOSITORY.getAllOrders(filter, { page, limit, sort })
  const mappedDocs = result.docs.map(mapOrderProductImages)

  return {
    data: mappedDocs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Update order status (Admin/Staff)
 */
const updateOrderStatus = async (orderId, status, requester) => {
  const updatedBy = requester?.id
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  assertBranchScopedOrderAccess(order, requester)

  // Validate status transition
  if (isOrderCancelled(order.orderStatus)) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật đơn hàng đã hủy'])
  }

  if (order.orderStatus === ORDER_STATUS.DELIVERED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật đơn hàng đã hoàn thành'])
  }

  // Block status update for VNPay orders that have not been paid
  if (order.paymentMethod === PAYMENT_METHODS.VNPAY) {
    const payment = await PAYMENT_REPOSITORY.findByOrderId(order._id, false)
    if (!payment || payment.status !== PAYMENT_STATUS.SUCCESS) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật trạng thái đơn hàng VNPay chưa thanh toán'])
    }
  }

  const updatedOrder = await ORDER_REPOSITORY.updateOrderStatus(orderId, status, updatedBy)

  // COD: mark as paid when delivered successfully
  if (status === ORDER_STATUS.DELIVERED && updatedOrder.paymentMethod === PAYMENT_METHODS.COD) {
    await ensureCodPaymentExists(updatedOrder, { status: PAYMENT_STATUS.SUCCESS, paidAt: new Date() })
  }

  // Send email notification (don't fail if email fails)
  try {
    await EMAIL_SERVICE.sendOrderStatusUpdate(
      updatedOrder.user.email,
      updatedOrder.user.fullname,
      updatedOrder
    )
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('Failed to send order status update email:', emailError.message)
  }

  return mapOrderProductImages(updatedOrder)
}

/**
 * Update shipping fee (Admin/Manager)
 */
const updateShippingFee = async (orderId, shippingFee, updatedBy) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  if (isOrderCancelled(order.orderStatus)) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật phí ship cho đơn hàng đã hủy'])
  }

  if (order.orderStatus === ORDER_STATUS.DELIVERED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật phí ship cho đơn hàng đã hoàn thành'])
  }

  const totalDiscount = calculateTotalDiscount(order.pricingApplied || [])
  const totalAmount = (order.subtotal || 0) - totalDiscount + shippingFee

  return await ORDER_REPOSITORY.updateOrderById(orderId, {
    shippingFee,
    totalAmount,
    updatedBy,
    updatedAt: new Date()
  })
}

/**
 * Cancel order
 */
const cancelOrderLegacy = async (orderId, cancelReason, userId, userRole) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Check permission
  if (userRole === 'customer' && order.user.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền hủy đơn hàng này'])
  }

  // Check if order can be cancelled
  if (isOrderCancelled(order.orderStatus)) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng đã được hủy trước đó'])
  }

  if (order.orderStatus === ORDER_STATUS.DELIVERED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy đơn hàng đã hoàn thành'])
  }

  if (order.orderStatus === ORDER_STATUS.SHIPPED && userRole === 'customer') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy đơn hàng đang vận chuyển. Vui lòng liên hệ hỗ trợ'])
  }

  const canceledOrder = await ORDER_REPOSITORY.cancelOrder(orderId, cancelReason, userId)

  // Cancel payment record for COD (best-effort)
  if (order.paymentMethod === PAYMENT_METHODS.COD) {
    const payment = await PAYMENT_REPOSITORY.findByOrderId(orderId, false)
    if (payment && payment.status === PAYMENT_STATUS.PENDING) {
      payment.status = PAYMENT_STATUS.CANCELLED
      payment.failureReason = cancelReason || 'Đơn hàng bị hủy'
      await PAYMENT_REPOSITORY.savePayment(payment)
    }
  }

  // Restore inventory if order was confirmed
  if (order.orderStatus !== ORDER_STATUS.PENDING) {
    await restoreInventoryForOrder(order)
  }

  // Send cancellation email (don't fail if email fails)
  try {
    await EMAIL_SERVICE.sendOrderCancellation(
      canceledOrder.user.email,
      canceledOrder.user.fullname,
      canceledOrder
    )
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('Failed to send order cancellation email:', emailError.message)
  }

  return mapOrderProductImages(canceledOrder)
}

/**
 * Cancel order (COD/VNPay rules)
 * - COD: orderStatus=CANCELLED, paymentStatus=CANCELLED, no refund flow/email
 * - VNPay: only allow when paymentStatus=SUCCESS; set paymentStatus=REFUNDED and send email
 */
const cancelOrder = async (orderId, userOrCancelReason, cancelReasonOrUserId, userIdOrUserRole, userRoleArg) => {
  // New signature: cancelOrder(orderId, user, cancelReason)
  // Backward compatible: cancelOrder(orderId, cancelReason, userId, userRole)
  let cancelReason
  let userId
  let userRole
  let userBranch = null

  if (typeof userOrCancelReason === 'string') {
    cancelReason = userOrCancelReason
    userId = cancelReasonOrUserId
    userRole = userIdOrUserRole
  } else {
    const user = userOrCancelReason || {}
    cancelReason = cancelReasonOrUserId
    userId = user.id || user._id
    userRole = user.role || userRoleArg
    userBranch = user.branch || null
  }

  if (!userId || !userRole) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Thiếu thông tin người dùng'])
  }

  const { shouldSendVNPayRefundEmail } = await runWithOptionalTransaction(async (session) => {
    const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false, session })

    if (!order) {
      throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
    }

    if (userRole === 'customer' && order.user.toString() !== userId.toString()) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền hủy đơn hàng này'])
    }

    assertBranchScopedOrderAccess(order, { role: userRole, branch: userBranch })

    if (isOrderCancelled(order.orderStatus)) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng đã được hủy trước đó'])
    }

    if (order.orderStatus === ORDER_STATUS.DELIVERED) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy đơn hàng đã hoàn thành'])
    }

    if (order.orderStatus === ORDER_STATUS.SHIPPED && userRole === 'customer') {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy đơn hàng đang vận chuyển. Vui lòng liên hệ hỗ trợ'])
    }

    if (order.paymentMethod === PAYMENT_METHODS.COD) {
      const canceledOrder = await ORDER_REPOSITORY.cancelOrder(orderId, cancelReason, userId, { session })
      if (!canceledOrder) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng đã được hủy trước đó'])
      }

      const payment = await PAYMENT_REPOSITORY.findByOrderId(orderId, false, { session })
      if (!payment) {
        await PAYMENT_REPOSITORY.createPayment({
          order: order._id,
          user: order.user,
          method: PAYMENT_METHODS.COD,
          provider: PAYMENT_PROVIDERS.COD,
          amount: order.totalAmount,
          currency: 'VND',
          status: PAYMENT_STATUS.CANCELLED,
          transactionId: generateTransactionId('COD'),
          paidAt: null,
          failureReason: cancelReason || 'Đơn hàng bị hủy'
        }, { session })
      } else {
        await PAYMENT_REPOSITORY.updateByOrderId(orderId, {
          status: PAYMENT_STATUS.CANCELLED,
          failureReason: cancelReason || 'Đơn hàng bị hủy'
        }, { session })
      }

      if (order.orderStatus !== ORDER_STATUS.PENDING) {
        await restoreInventoryForOrder(order, { session })
      }

      return { shouldSendVNPayRefundEmail: false }
    }

    if (order.paymentMethod === PAYMENT_METHODS.VNPAY) {
      const payment = await PAYMENT_REPOSITORY.findByOrderId(orderId, false, { session })
      if (!payment) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy thông tin thanh toán'])
      }

      if (payment.status !== PAYMENT_STATUS.SUCCESS) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ cho phép hủy đơn VNPay khi đã thanh toán thành công'])
      }

      const canceledOrder = await ORDER_REPOSITORY.cancelOrder(orderId, cancelReason, userId, { session })
      if (!canceledOrder) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng đã được hủy trước đó'])
      }

      const refundedPayment = await PAYMENT_REPOSITORY.updateByOrderIdAndStatus(orderId, PAYMENT_STATUS.SUCCESS, {
        status: PAYMENT_STATUS.REFUNDED,
        refundedAt: new Date()
      }, { session })

      if (!refundedPayment) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái thanh toán không hợp lệ để hoàn tiền'])
      }

      if (order.orderStatus !== ORDER_STATUS.PENDING) {
        await restoreInventoryForOrder(order, { session })
      }

      return { shouldSendVNPayRefundEmail: true }
    }

    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Phương thức thanh toán không hợp lệ'])
  })

  const populatedOrder = await ORDER_REPOSITORY.getOrderById(orderId)

  if (shouldSendVNPayRefundEmail) {
    try {
      await EMAIL_SERVICE.sendVNPayCancelRefundEmail(
        populatedOrder.user.email,
        populatedOrder.user.fullname,
        populatedOrder.orderNumber
      )
    } catch (emailError) {
      // eslint-disable-next-line no-console
      console.error('Failed to send VNPay refund email:', emailError.message)
    }
  }

  return mapOrderProductImages(populatedOrder)
}

/**
 * Update delivery info (Admin/Staff)
 */
const updateDeliveryInfo = async (orderId, deliveryData, requester) => {
  const updatedBy = requester?.id
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  if (isOrderCancelled(order.orderStatus)) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật thông tin vận chuyển cho đơn hàng đã hủy'])
  }

  assertBranchScopedOrderAccess(order, requester)

  const updateData = {
    delivery: {
      ...order.delivery,
      ...deliveryData
    },
    updatedBy
  }

  // If delivery is marked delivered, also mark order delivered (without email side-effects)
  if (deliveryData?.status === DELIVERY_STATUS.DELIVERED) {
    updateData.orderStatus = ORDER_STATUS.DELIVERED
    if (!deliveryData?.deliveredAt) {
      updateData['delivery.deliveredAt'] = new Date()
    }
  }

  const updatedOrder = await ORDER_REPOSITORY.updateOrderById(orderId, updateData)

  // COD: mark as paid when delivery is successful (works even if staff only updates delivery.status)
  if (
    updatedOrder.paymentMethod === PAYMENT_METHODS.COD &&
    (deliveryData?.status === DELIVERY_STATUS.DELIVERED || !!deliveryData?.deliveredAt)
  ) {
    await ensureCodPaymentExists(updatedOrder, { status: PAYMENT_STATUS.SUCCESS, paidAt: deliveryData?.deliveredAt || new Date() })
  }

  return updatedOrder
}

/**
 * Get order statistics
 */
const getOrderStatistics = async (userId = null) => {
  const stats = await ORDER_REPOSITORY.countOrdersByStatus(userId)

  const result = {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  }

  stats.forEach(stat => {
    result[stat._id] = stat.count
    result.total += stat.count
  })

  return result
}

/**
 * Create offline order (for walk-in customers at branch)
 */
const createOfflineOrder = async (staffId, orderData) => {
  const {
    customerId = null,
    items,
    shippingAddress = null,
    paymentMethod,
    message = '',
    branchId,
    hasDelivery = false
  } = orderData

  if (hasDelivery && !shippingAddress) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Địa chỉ giao hàng là bắt buộc khi có giao hàng'])
  }

  // Validate items and get product details
  if (!items || items.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng phải có ít nhất 1 sản phẩm'])
  }

  // Validate and populate items with product details
  const populatedItems = []
  for (const item of items) {
    const product = await PRODUCT_SERVICE.getProductById(item.product)

    if (!product) {
      throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại'])
    }

    const itemData = {
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      services: []
    }

    // Validate and populate services
    if (item.services && item.services.length > 0) {
      for (const serviceId of item.services) {
        const service = await SERVICE_ITEM_SERVICE.getServiceById(serviceId)
        if (service) {
          itemData.services.push({
            service: service._id,
            price: service.price
          })
        }
      }
    }

    populatedItems.push(itemData)
  }

  // Check inventory availability at branch
  for (const item of populatedItems) {
    const storeInventory = await STORE_INVENTORY_SERVICE.getStoreInventoryByBranchAndProduct(branchId, item.product)
    if (!storeInventory || storeInventory.quantity < item.quantity) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Sản phẩm không đủ tồn kho tại chi nhánh'])
    }
  }

  // Calculate pricing discounts
  const itemsWithProduct = populatedItems.map(item => ({
    ...item,
    product: { _id: item.product }
  }))
  const pricingApplied = await calculatePricingDiscounts(itemsWithProduct)

  // Calculate totals (include shipping fee)
  const shippingFee = hasDelivery
    ? await calculateShippingFee(shippingAddress, branchId)
    : SHIPPING_FEE.INTRA_PROVINCE
  const { subtotal, totalAmount } = calculateOrderTotals(populatedItems, pricingApplied, shippingFee)

  // Generate order number
  const orderNumber = generateOrderNumber()
  const isCounterPickup = !hasDelivery
  const deliveredAt = isCounterPickup ? new Date() : null

  // Determine the user for the order (customer or staff if no customer)
  const orderUserId = customerId || staffId

  // Create order
  const order = await ORDER_REPOSITORY.createOrder({
    orderNumber,
    type: 'offline',
    user: orderUserId,
    items: populatedItems,
    shippingAddress: hasDelivery && shippingAddress ? shippingAddress : null,
    orderStatus: isCounterPickup ? ORDER_STATUS.DELIVERED : ORDER_STATUS.CONFIRMED,
    subtotal,
    shippingFee,
    totalAmount,
    pricingApplied,
    paymentMethod,
    delivery: {
      status: isCounterPickup ? DELIVERY_STATUS.DELIVERED : DELIVERY_STATUS.PENDING,
      deliveredAt,
      recipientName: shippingAddress?.fullname || ''
    },
    message,
    branch: branchId,
    createdBy: staffId
  })

  // Create payment record for offline COD orders (paid immediately if no delivery)
  if (paymentMethod === PAYMENT_METHODS.COD) {
    await ensureCodPaymentExists(order, {
      status: hasDelivery ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.SUCCESS,
      paidAt: hasDelivery ? null : new Date()
    })
  }

  // Decrease inventory immediately for offline orders
  await decreaseInventoryForOrder(branchId, populatedItems)

  // Get populated order
  const populatedOrder = await ORDER_REPOSITORY.getOrderById(order._id)

  return populatedOrder
}

export const ORDER_SERVICE = {
  createOrder,
  getOrderById,
  getOrderByOrderNumber,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateShippingFee,
  cancelOrder,
  updateDeliveryInfo,
  getOrderStatistics,
  createOfflineOrder
}
