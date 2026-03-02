import { paymentModel } from '#models/paymentModel.js'

const createPayment = async (paymentData) => {
  return await paymentModel.create(paymentData)
}

const findByVnpTxnRef = async (vnpTxnRef) => {
  return await paymentModel.findOne({ vnp_TxnRef: vnpTxnRef })
}

const findByOrderId = async (orderId, populate = true) => {
  let query = paymentModel.findOne({ order: orderId })

  if (populate) {
    query = query
      .populate('order', 'orderNumber totalAmount orderStatus')
      .populate('user', 'fullname email')
  }

  return await query
}

const findByOrderIdAndUserId = async (orderId, userId) => {
  return await paymentModel.findOne({ order: orderId, user: userId })
}

const findByTransactionId = async (transactionId, populate = true) => {
  let query = paymentModel.findOne({ transactionId })

  if (populate) {
    query = query
      .populate('order', 'orderNumber totalAmount orderStatus')
      .populate('user', 'fullname email')
  }

  return await query
}

const findByUserId = async (userId, options = {}) => {
  const { page = 1, limit = 10, status } = options
  const queryFilter = { user: userId }

  if (status) {
    queryFilter.status = status
  }

  const payments = await paymentModel.find(queryFilter)
    .populate('order', 'orderNumber totalAmount orderStatus')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  const total = await paymentModel.countDocuments(queryFilter)

  return { payments, total }
}

const updateById = async (paymentId, updateData) => {
  return await paymentModel.findByIdAndUpdate(paymentId, updateData, { new: true })
}

const savePayment = async (payment) => {
  return await payment.save()
}

/**
 * Bulk-cancel all pending payments for the given order IDs
 */
const cancelPendingPaymentsByOrderIds = async (orderIds, cancelReason = 'Hết thời gian thanh toán VNPay') => {
  return await paymentModel.updateMany(
    { order: { $in: orderIds }, status: 'pending' },
    { $set: { status: 'canceled', failureReason: cancelReason } }
  )
}

export const PAYMENT_REPOSITORY = {
  createPayment,
  findByTxnRef: findByVnpTxnRef,
  findByOrderId,
  findByOrderAndUser: findByOrderIdAndUserId,
  findByTransactionId,
  findByUserWithPagination: findByUserId,
  updateById,
  savePayment,
  cancelPendingPaymentsByOrderIds
}
