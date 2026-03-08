import { ORDER_REPOSITORY } from '#repositories/orderRepository.js'
import { PAYMENT_REPOSITORY } from '#repositories/paymentRepository.js'
import { PRICING_REPOSITORY } from '#repositories/pricingRepository.js'
import { VNPAY_SERVICE } from '#services/vnpayService.js'
import { CART_SERVICE } from '#services/cartService.js'
import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PAYMENT_STATUS, PAYMENT_METHODS, PAYMENT_PROVIDERS } from '#constants/paymentConstant.js'
import { ORDER_STATUS, DELIVERY_STATUS, SHIPPING_FEE } from '#constants/orderConstant.js'
import { env } from '#configs/environment.js'
import crypto from 'crypto'
import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'

const generateTransactionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `TXN-${timestamp}-${random}`
}

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `ORD-${timestamp}-${random}`
}

const calculatePricingDiscounts = async (items) => {
  const pricingApplied = []

  for (const item of items) {
    const productId = item.product._id || item.product

    const pricingRules = await PRICING_REPOSITORY.getPricingRulesForProduct(productId, item.quantity)

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

const calculateOrderTotals = (items, pricingApplied) => {
  let subtotal = 0

  for (const item of items) {
    const productTotal = item.price * item.quantity
    const servicesTotal = item.services.reduce((sum, service) => sum + service.price * item.quantity, 0)
    subtotal += productTotal + servicesTotal
  }

  const totalDiscount = pricingApplied.reduce((sum, pricing) => sum + pricing.discountAmount, 0)
  const totalAmount = subtotal - totalDiscount

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

const findBranchWithStock = async (items) => {
  const productIds = items.map(item => item.product._id || item.product)

  for (const item of items) {
    const productId = item.product._id || item.product
    const storeInventories = await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(productId)

    const availableBranch = storeInventories.find(inv => inv.quantity >= item.quantity)

    if (!availableBranch) {
      const productName = item.product.name || 'Unknown Product'
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Sản phẩm "${productName}" không đủ tồn kho tại bất kỳ chi nhánh nào`])
    }
  }

  const firstProductId = productIds[0]
  const inventories = await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(firstProductId)
  return inventories.find(inv => inv.quantity > 0)?.branch._id || null
}

const decreaseInventoryForOrder = async (branchId, items) => {
  for (const item of items) {
    const productId = item.product._id || item.product
    await STORE_INVENTORY_SERVICE.decreaseStoreInventoryOnSale(branchId, productId, item.quantity)
  }
}

const validateVNPayBankCode = (bankCode) => {
  if (!bankCode) {
    return ''
  }

  const normalizedBankCode = bankCode.toString().trim().toUpperCase()
  if (!normalizedBankCode) {
    return ''
  }

  const supportedBankCodes = new Set(
    VNPAY_SERVICE.getSupportedBanks().map(bank => bank.code)
  )

  if (!supportedBankCodes.has(normalizedBankCode)) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Mã ngân hàng không được VNPay hỗ trợ'])
  }

  return normalizedBankCode
}

const createVNPayPayment = async (userId, paymentData, ipAddress) => {
  const { shippingAddress, message = '', bankCode = '', locale = 'vn' } = paymentData
  const validatedBankCode = validateVNPayBankCode(bankCode)

  const cart = await CART_SERVICE.validateCartBeforeCheckout(userId)

  if (!cart || cart.items.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Giỏ hàng đang trống'])
  }

  const populatedCart = await CART_SERVICE.getCart(userId)

  const pricingApplied = await calculatePricingDiscounts(populatedCart.items)

  const baseTotals = calculateOrderTotals(populatedCart.items, pricingApplied)

  // Automatically find a branch with available stock (customers do not specify branch)
  const selectedBranch = await findBranchWithStock(populatedCart.items)

  const shippingFee = await calculateShippingFee(shippingAddress, selectedBranch)
  const totalAmount = baseTotals.totalAmount + shippingFee

  const orderNumber = generateOrderNumber()

  const order = await ORDER_REPOSITORY.createOrder({
    orderNumber,
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
    subtotal: baseTotals.subtotal,
    shippingFee,
    totalAmount,
    pricingApplied,
    paymentMethod: PAYMENT_METHODS.VNPAY,
    delivery: {
      status: DELIVERY_STATUS.PENDING
    },
    message,
    branch: selectedBranch,
    createdBy: userId
  })

  const transactionId = generateTransactionId()

  const payment = await PAYMENT_REPOSITORY.createPayment({
    order: order._id,
    user: userId,
    method: PAYMENT_METHODS.VNPAY,
    provider: PAYMENT_PROVIDERS.VNPAY,
    amount: totalAmount,
    currency: 'VND',
    status: PAYMENT_STATUS.PENDING,
    transactionId,
    vnp_TxnRef: orderNumber
  })

  const paymentUrl = VNPAY_SERVICE.createPaymentUrl({
    orderNumber,
    amount: totalAmount,
    orderInfo: `Thanh toan don hang ${orderNumber}`,
    ipAddress,
    locale,
    bankCode: validatedBankCode
  })

  payment.paymentUrl = paymentUrl
  await PAYMENT_REPOSITORY.savePayment(payment)

  return {
    paymentUrl,
    orderId: order._id,
    orderNumber,
    transactionId,
    amount: totalAmount
  }
}

const processVNPayReturn = async (vnpParams) => {
  const verifyResult = VNPAY_SERVICE.verifyReturnUrl(vnpParams)

  if (!verifyResult.isValid) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chữ ký không hợp lệ'])
  }

  const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_BankCode } = verifyResult

  // Find payment by order number
  const payment = await PAYMENT_REPOSITORY.findByTxnRef(vnp_TxnRef)

  if (!payment) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy thông tin thanh toán'])
  }

  if (payment.status !== PAYMENT_STATUS.PENDING) {
    return {
      success: payment.status === PAYMENT_STATUS.SUCCESS,
      message: payment.status === PAYMENT_STATUS.SUCCESS ? 'Đơn hàng đã được thanh toán trước đó' : 'Thanh toán đã bị hủy hoặc thất bại',
      payment,
      orderNumber: vnp_TxnRef
    }
  }

  const order = await ORDER_REPOSITORY.getOrderById(payment.order)

  if (!order) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy đơn hàng'])
  }

  const isSuccess = VNPAY_SERVICE.isPaymentSuccess(vnp_ResponseCode)
  const responseMessage = VNPAY_SERVICE.getResponseMessage(vnp_ResponseCode)

  payment.vnp_ResponseCode = vnp_ResponseCode
  payment.vnp_TransactionNo = vnp_TransactionNo || ''
  payment.vnp_BankCode = vnp_BankCode || ''
  payment.responseData = vnpParams

  if (isSuccess) {
    payment.status = PAYMENT_STATUS.SUCCESS
    payment.paidAt = new Date()
    await PAYMENT_REPOSITORY.savePayment(payment)

    await ORDER_REPOSITORY.updateOrderStatus(order._id, ORDER_STATUS.CONFIRMED, order.user)

    await decreaseInventoryForOrder(order.branch, order.items)

    await CART_SERVICE.clearCart(order.user)

    const updatedOrder = await ORDER_REPOSITORY.getOrderById(order._id)

    try {
      await EMAIL_SERVICE.sendOrderConfirmation(
        updatedOrder.user.email,
        updatedOrder.user.fullname,
        updatedOrder
      )
    } catch {
      // Silently fail email sending
    }

    return {
      success: true,
      message: 'Thanh toán thành công',
      payment,
      order: updatedOrder,
      orderNumber: vnp_TxnRef
    }
  } else {
    payment.status = PAYMENT_STATUS.FAILED
    payment.failureReason = responseMessage
    await PAYMENT_REPOSITORY.savePayment(payment)

    await ORDER_REPOSITORY.cancelOrder(order._id, `Thanh toán thất bại: ${responseMessage}`, order.user)

    return {
      success: false,
      message: responseMessage,
      payment,
      orderNumber: vnp_TxnRef
    }
  }
}

const processVNPayIPN = async (vnpParams) => {
  const verifyResult = VNPAY_SERVICE.verifyReturnUrl(vnpParams)

  if (!verifyResult.isValid) {
    return { RspCode: '97', Message: 'Checksum failed' }
  }

  const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_BankCode, vnp_Amount } = verifyResult

  const payment = await PAYMENT_REPOSITORY.findByTxnRef(vnp_TxnRef)

  if (!payment) {
    return { RspCode: '01', Message: 'Order not found' }
  }

  if (payment.amount !== vnp_Amount) {
    return { RspCode: '04', Message: 'Invalid amount' }
  }

  if (payment.status !== PAYMENT_STATUS.PENDING) {
    return { RspCode: '02', Message: 'Order already confirmed' }
  }

  const order = await ORDER_REPOSITORY.getOrderById(payment.order, { populate: false })

  if (!order) {
    return { RspCode: '01', Message: 'Order not found' }
  }

  const isSuccess = VNPAY_SERVICE.isPaymentSuccess(vnp_ResponseCode)
  const responseMessage = VNPAY_SERVICE.getResponseMessage(vnp_ResponseCode)

  payment.vnp_ResponseCode = vnp_ResponseCode
  payment.vnp_TransactionNo = vnp_TransactionNo || ''
  payment.vnp_BankCode = vnp_BankCode || ''
  payment.responseData = vnpParams

  if (isSuccess) {
    payment.status = PAYMENT_STATUS.SUCCESS
    payment.paidAt = new Date()
    await PAYMENT_REPOSITORY.savePayment(payment)

    await ORDER_REPOSITORY.updateOrderStatus(order._id, ORDER_STATUS.CONFIRMED, order.user)

    await decreaseInventoryForOrder(order.branch, order.items)

    await CART_SERVICE.clearCart(order.user)

    return { RspCode: '00', Message: 'Success' }
  } else {
    payment.status = PAYMENT_STATUS.FAILED
    payment.failureReason = responseMessage
    await PAYMENT_REPOSITORY.savePayment(payment)

    await ORDER_REPOSITORY.cancelOrder(order._id, `Thanh toán thất bại: ${responseMessage}`, order.user)

    return { RspCode: '00', Message: 'Success' }
  }
}

/**
 * Get payment by order ID
 * @param {string} orderId - Order ID
 * @returns {Object} Payment record
 */
const getPaymentByOrderId = async (orderId) => {
  const payment = await PAYMENT_REPOSITORY.findByOrderId(orderId)
  return payment
}

/**
 * Get payment by order number (VNPay txn ref)
 * @param {string} orderNumber - Order number
 * @returns {Object} Payment record
 */
const getPaymentByOrderNumber = async (orderNumber) => {
  const payment = await PAYMENT_REPOSITORY.findByTxnRef(orderNumber)
  return payment
}

/**
 * Get payment by transaction ID
 * @param {string} transactionId - Transaction ID
 * @returns {Object} Payment record
 */
const getPaymentByTransactionId = async (transactionId) => {
  const payment = await PAYMENT_REPOSITORY.findByTransactionId(transactionId)
  return payment
}

/**
 * Get user's payments
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Array} Payment records
 */
const getUserPayments = async (userId, query = {}) => {
  const { page = 1, limit = 10, status } = query

  const result = await PAYMENT_REPOSITORY.findByUserWithPagination(userId, { page, limit, status })

  return {
    data: result.payments,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }
  }
}

/**
 * Get supported VNPay banks
 * @returns {Array} List of supported banks
 */
const getSupportedBanks = () => {
  return VNPAY_SERVICE.getSupportedBanks()
}

/**
 * Query transaction status from VNPay
 * @param {string} orderNumber - Order number
 * @param {string} ipAddress - IP address
 * @returns {Object} Transaction status
 */
const queryTransactionStatus = async (orderNumber, ipAddress) => {
  const payment = await PAYMENT_REPOSITORY.findByTxnRef(orderNumber)

  if (!payment) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy thông tin thanh toán'])
  }

  const transDate = VNPAY_SERVICE.formatDate(payment.createdAt)

  const result = await VNPAY_SERVICE.queryTransaction({
    orderId: orderNumber,
    transDate,
    ipAddress
  })

  return result
}

/**
 * Cancel pending VNPay payment
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Object} Cancelled payment
 */
const cancelPayment = async (orderId, userId) => {
  const payment = await PAYMENT_REPOSITORY.findByOrderAndUser(orderId, userId)

  if (!payment) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy thông tin thanh toán'])
  }

  if (payment.status !== PAYMENT_STATUS.PENDING) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể hủy thanh toán đã xử lý'])
  }

  payment.status = PAYMENT_STATUS.CANCELED
  await PAYMENT_REPOSITORY.savePayment(payment)

  // Cancel the order
  await ORDER_REPOSITORY.cancelOrder(orderId, 'Khách hàng hủy thanh toán', userId)

  return payment
}

/**
 * Build VNPay return redirect URL (success/failed)
 * Similar to buildGoogleAuthRedirectUrl pattern
 */
const buildVNPayReturnRedirectUrl = (result) => {
  const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'

  if (result.success) {
    const redirectUrl = new URL(`${clientUrl}/payment/success`)
    redirectUrl.searchParams.set('orderNumber', result.orderNumber)
    return redirectUrl.toString()
  } else {
    const redirectUrl = new URL(`${clientUrl}/payment/failed`)
    redirectUrl.searchParams.set('orderNumber', result.orderNumber)
    redirectUrl.searchParams.set('message', result.message)
    return redirectUrl.toString()
  }
}

/**
 * Build VNPay error redirect URL
 * Similar to buildGoogleAuthErrorUrl pattern
 */
const buildVNPayErrorRedirectUrl = (error) => {
  const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'
  const errorUrl = new URL(`${clientUrl}/payment/error`)
  const detailedMessage = Array.isArray(error.errors) && error.errors.length > 0
    ? error.errors[0]
    : error.message
  errorUrl.searchParams.set('message', detailedMessage || 'Có lỗi xảy ra')
  return errorUrl.toString()
}

export const PAYMENT_SERVICE = {
  createVNPayPayment,
  processVNPayReturn,
  processVNPayIPN,
  getPaymentByOrderId,
  getPaymentByOrderNumber,
  getPaymentByTransactionId,
  getUserPayments,
  getSupportedBanks,
  queryTransactionStatus,
  cancelPayment,
  buildVNPayReturnRedirectUrl,
  buildVNPayErrorRedirectUrl
}
