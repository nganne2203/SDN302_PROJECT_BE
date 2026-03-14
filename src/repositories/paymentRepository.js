import { paymentModel } from '#models/paymentModel.js'

const createPayment = async (paymentData, options = {}) => {
  const { session = null } = options
  const payment = new paymentModel(paymentData)
  return await payment.save({ session })
}

const findByVnpTxnRef = async (vnpTxnRef, options = {}) => {
  const { session = null } = options
  let query = paymentModel.findOne({ vnp_TxnRef: vnpTxnRef })
  if (session) query = query.session(session)
  return await query
}

const findByOrderId = async (orderId, populate = true, options = {}) => {
  const { session = null } = options
  let query = paymentModel.findOne({ order: orderId })
  if (session) query = query.session(session)

  if (populate) {
    query = query
      .populate('order', 'orderNumber totalAmount orderStatus')
      .populate('user', 'fullname email')
  }

  return await query
}

const findByOrderIdAndUserId = async (orderId, userId, options = {}) => {
  const { session = null } = options
  let query = paymentModel.findOne({ order: orderId, user: userId })
  if (session) query = query.session(session)
  return await query
}

const findByTransactionId = async (transactionId, populate = true, options = {}) => {
  const { session = null } = options
  let query = paymentModel.findOne({ transactionId })
  if (session) query = query.session(session)

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

const updateByIdWithOptions = async (paymentId, updateData, options = {}) => {
  const { session = null } = options
  return await paymentModel.findByIdAndUpdate(paymentId, updateData, { new: true, session })
}

const savePayment = async (payment, options = {}) => {
  const { session = null } = options
  return await payment.save({ session })
}

const updateByOrderId = async (orderId, updateData, options = {}) => {
  const { session = null } = options
  return await paymentModel.findOneAndUpdate(
    { order: orderId },
    { $set: updateData },
    { new: true, session }
  )
}

const updateByOrderIdAndStatus = async (orderId, status, updateData, options = {}) => {
  const { session = null } = options
  return await paymentModel.findOneAndUpdate(
    { order: orderId, status },
    { $set: updateData },
    { new: true, session }
  )
}

/**
 * Bulk-cancel all pending payments for the given order IDs
 */
const cancelPendingPaymentsByOrderIds = async (orderIds, cancelReason = 'Hết thời gian thanh toán VNPay') => {
  return await paymentModel.updateMany(
    { order: { $in: orderIds }, status: 'pending' },
    { $set: { status: 'cancelled', failureReason: cancelReason } }
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
  updateByIdWithOptions,
  savePayment,
  updateByOrderId,
  updateByOrderIdAndStatus,
  cancelPendingPaymentsByOrderIds
}
