import { ORDER_REPOSITORY } from '#repositories/orderRepository.js'
import { CART_SERVICE } from '#services/cartService.js'
import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { ORDER_STATUS, DELIVERY_STATUS, SHIPPING_FEE } from '#constants/orderConstant.js'
import { PAYMENT_METHODS } from '#constants/paymentConstant.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { pricingModel } from '#models/pricingModel.js'
import crypto from 'crypto'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { SERVICE_ITEM_SERVICE } from '#services/serviceItemService.js'
import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `ORD-${timestamp}-${random}`
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
 * Find best branch with available stock
 */
const findBranchWithStock = async (items) => {
  // Get all store inventories for products in the order
  const productIds = items.map(item => item.product._id || item.product)

  for (const item of items) {
    const productId = item.product._id || item.product
    const storeInventories = await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(productId)

    // Find branch with sufficient stock
    const availableBranch = storeInventories.find(inv => inv.quantity >= item.quantity)

    if (!availableBranch) {
      const productName = item.product.name || 'Unknown Product'
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Sản phẩm "${productName}" không đủ tồn kho tại bất kỳ chi nhánh nào`])
    }
  }

  // Return first available branch (can be improved with better logic)
  const firstProductId = productIds[0]
  const inventories = await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(firstProductId)
  return inventories.find(inv => inv.quantity > 0)?.branch._id || null
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
 * Restore inventory when order is canceled
 */
const restoreInventoryForOrder = async (order) => {
  if (!order.branch) {
    return
  }

  for (const item of order.items) {
    const productId = item.product._id || item.product
    await STORE_INVENTORY_SERVICE.increaseStoreInventory(order.branch, productId, item.quantity)
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

  // Automatically find a branch with available stock (customers do not specify branch)
  const selectedBranch = await findBranchWithStock(populatedCart.items)

  // Calculate totals (include shipping fee)
  const shippingFee = await calculateShippingFee(shippingAddress, selectedBranch)
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
    branch: selectedBranch,
    createdBy: userId
  })

  // For COD, confirm order and decrease inventory immediately
  if (paymentMethod === PAYMENT_METHODS.COD) {
    await ORDER_REPOSITORY.updateOrderStatus(order._id, ORDER_STATUS.CONFIRMED, userId)
    await decreaseInventoryForOrder(selectedBranch, populatedCart.items)
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
const getOrderById = async (orderId, userId, userRole) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId)

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Check permission: user can only view their own orders, admin/staff can view all
  if (userRole === 'customer' && order.user._id.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền xem đơn hàng này'])
  }

  return order
}

/**
 * Get order by order number
 */
const getOrderByOrderNumber = async (orderNumber, userId, userRole) => {
  const order = await ORDER_REPOSITORY.getOrderByOrderNumber(orderNumber)

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Check permission
  if (userRole === 'customer' && order.user._id.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền xem đơn hàng này'])
  }

  return order
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

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Get all orders (Admin/Staff)
 */
const getAllOrders = async (query = {}) => {
  const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = query

  const filter = {}
  if (status) {
    filter.orderStatus = status
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const result = await ORDER_REPOSITORY.getAllOrders(filter, { page, limit, sort })

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Update order status (Admin/Staff)
 */
const updateOrderStatus = async (orderId, status, updatedBy) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Validate status transition
  if (order.orderStatus === ORDER_STATUS.CANCELED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật đơn hàng đã hủy'])
  }

  if (order.orderStatus === ORDER_STATUS.DELIVERED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật đơn hàng đã hoàn thành'])
  }

  const updatedOrder = await ORDER_REPOSITORY.updateOrderStatus(orderId, status, updatedBy)

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

  return updatedOrder
}

/**
 * Update shipping fee (Admin/Manager)
 */
const updateShippingFee = async (orderId, shippingFee, updatedBy) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  if (order.orderStatus === ORDER_STATUS.CANCELED) {
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
const cancelOrder = async (orderId, cancelReason, userId, userRole) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  // Check permission
  if (userRole === 'customer' && order.user.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền hủy đơn hàng này'])
  }

  // Check if order can be canceled
  if (order.orderStatus === ORDER_STATUS.CANCELED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Đơn hàng đã được hủy trước đó'])
  }

  if (order.orderStatus === ORDER_STATUS.DELIVERED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy đơn hàng đã hoàn thành'])
  }

  if (order.orderStatus === ORDER_STATUS.SHIPPED && userRole === 'customer') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy đơn hàng đang vận chuyển. Vui lòng liên hệ hỗ trợ'])
  }

  const canceledOrder = await ORDER_REPOSITORY.cancelOrder(orderId, cancelReason, userId)

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

  return canceledOrder
}

/**
 * Update delivery info (Admin/Staff)
 */
const updateDeliveryInfo = async (orderId, deliveryData, updatedBy) => {
  const order = await ORDER_REPOSITORY.getOrderById(orderId, { populate: false })

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đơn hàng không tồn tại'])
  }

  if (order.orderStatus === ORDER_STATUS.CANCELED) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể cập nhật thông tin vận chuyển cho đơn hàng đã hủy'])
  }

  const updateData = {
    delivery: {
      ...order.delivery,
      ...deliveryData
    },
    updatedBy
  }

  const updatedOrder = await ORDER_REPOSITORY.updateOrderById(orderId, updateData)

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
    canceled: 0
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

  // Determine the user for the order (customer or staff if no customer)
  const orderUserId = customerId || staffId

  // Create order
  const order = await ORDER_REPOSITORY.createOrder({
    orderNumber,
    type: 'offline',
    user: orderUserId,
    items: populatedItems,
    shippingAddress: hasDelivery && shippingAddress ? shippingAddress : null,
    orderStatus: ORDER_STATUS.CONFIRMED, // Offline orders are confirmed immediately
    subtotal,
    shippingFee,
    totalAmount,
    pricingApplied,
    paymentMethod,
    delivery: hasDelivery
      ? {
        status: DELIVERY_STATUS.PENDING,
        recipientName: shippingAddress?.fullname || ''
      }
      : null,
    message,
    branch: branchId,
    createdBy: staffId
  })

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
