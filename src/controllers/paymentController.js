import { PAYMENT_SERVICE } from '#services/paymentService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'
import { env } from '#configs/environment.js'

/**
 * Get client IP address
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
}

/**
 * Create VNPay payment
 * POST /api/payments/vnpay/create
 */
const createVNPayPayment = async (req, res, next) => {
  try {
    const userId = req.user.id
    const ipAddress = getClientIp(req)

    const result = await PAYMENT_SERVICE.createVNPayPayment(userId, req.body, ipAddress)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Tạo thanh toán VNPay thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * VNPay return URL handler
 * GET /api/payments/vnpay-return
 */
const vnpayReturn = async (req, res) => {
  try {
    const result = await PAYMENT_SERVICE.processVNPayReturn(req.validated.query)

    // Redirect to frontend with result
    const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'
    const redirectUrl = result.success
      ? `${clientUrl}/payment/success?orderNumber=${result.orderNumber}`
      : `${clientUrl}/payment/failed?orderNumber=${result.orderNumber}&message=${encodeURIComponent(result.message)}`

    res.redirect(redirectUrl)
  } catch (error) {
    // Redirect to error page on failure
    const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'
    res.redirect(`${clientUrl}/payment/error?message=${encodeURIComponent(error.message)}`)
  }
}

/**
 * VNPay IPN handler (Instant Payment Notification)
 * GET /api/payments/vnpay-ipn
 */
const vnpayIPN = async (req, res) => {
  try {
    const result = await PAYMENT_SERVICE.processVNPayIPN(req.validated.query)
    res.status(StatusCodes.OK).json(result)
  } catch {
    res.status(StatusCodes.OK).json({ RspCode: '99', Message: 'Unknown error' })
  }
}

/**
 * Get payment by order ID
 * GET /api/payments/order/:orderId
 */
const getPaymentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const payment = await PAYMENT_SERVICE.getPaymentByOrderId(orderId)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: payment,
        message: 'Lấy thông tin thanh toán thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get user's payments
 * GET /api/payments/my-payments
 */
const getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await PAYMENT_SERVICE.getUserPayments(userId, req.validated.query)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách thanh toán thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get supported banks
 * GET /api/payments/banks
 */
const getSupportedBanks = async (req, res, next) => {
  try {
    const banks = PAYMENT_SERVICE.getSupportedBanks()

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: banks,
        message: 'Lấy danh sách ngân hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Query transaction status
 * GET /api/payments/status/:orderNumber
 */
const queryTransactionStatus = async (req, res, next) => {
  try {
    const { orderNumber } = req.params
    const ipAddress = getClientIp(req)

    const result = await PAYMENT_SERVICE.queryTransactionStatus(orderNumber, ipAddress)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy trạng thái giao dịch thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel pending payment
 * POST /api/payments/:orderId/cancel
 */
const cancelPayment = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { orderId } = req.params

    const result = await PAYMENT_SERVICE.cancelPayment(orderId, userId)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Hủy thanh toán thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Check payment result (for frontend polling)
 * GET /api/payments/check/:orderNumber
 */
const checkPaymentResult = async (req, res, next) => {
  try {
    const { orderNumber } = req.params
    const payment = await PAYMENT_SERVICE.getPaymentByOrderId(orderNumber)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: {
          status: payment?.status || 'not_found',
          orderId: payment?.order?._id,
          orderNumber: payment?.order?.orderNumber
        },
        message: 'Kiểm tra kết quả thanh toán thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const PAYMENT_CONTROLLER = {
  createVNPayPayment,
  vnpayReturn,
  vnpayIPN,
  getPaymentByOrderId,
  getMyPayments,
  getSupportedBanks,
  queryTransactionStatus,
  cancelPayment,
  checkPaymentResult
}
