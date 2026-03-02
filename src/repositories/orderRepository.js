import { orderModel } from '#models/orderModel.js'
import { ORDER_STATUS } from '#constants/orderConstant.js'

const createOrder = async (orderData) => {
  return await orderModel.create(orderData)
}

const getOrderById = async (orderId, options = {}) => {
  const { populate = true } = options
  let query = orderModel.findById(orderId)

  if (populate) {
    query = query
      .populate('user', 'fullname email phone')
      .populate('items.product', 'name price images slug category')
      .populate('items.services.service', 'name type price')
      .populate('branch', 'name address phone')
      .populate('createdBy', 'fullname email')
      .populate('updatedBy', 'fullname email')
  }

  return await query.exec()
}

const getOrderByOrderNumber = async (orderNumber, options = {}) => {
  const { populate = true } = options
  let query = orderModel.findOne({ orderNumber })

  if (populate) {
    query = query
      .populate('user', 'fullname email phone')
      .populate('items.product', 'name price images slug category')
      .populate('items.services.service', 'name type price')
      .populate('branch', 'name address phone')
      .populate('createdBy', 'fullname email')
      .populate('updatedBy', 'fullname email')
  }

  return await query.exec()
}

const getOrdersByUser = async (userId, filter = {}, options = {}) => {
  const query = { user: userId, ...filter }
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options

  return await orderModel.paginate(query, {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'fullname email phone' },
      { path: 'items.product', select: 'name price images slug category' },
      { path: 'items.services.service', select: 'name type price' },
      { path: 'branch', select: 'name address phone' }
    ]
  })
}

const getAllOrders = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options

  return await orderModel.paginate(filter, {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'fullname email phone' },
      { path: 'items.product', select: 'name price images slug category' },
      { path: 'items.services.service', select: 'name type price' },
      { path: 'branch', select: 'name address phone' },
      { path: 'createdBy', select: 'fullname email' },
      { path: 'updatedBy', select: 'fullname email' }
    ]
  })
}

const updateOrderById = async (orderId, updateData) => {
  return await orderModel.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
    .populate('createdBy', 'fullname email')
    .populate('updatedBy', 'fullname email')
}

const updateOrderStatus = async (orderId, status, updatedBy) => {
  return await orderModel.findByIdAndUpdate(
    orderId,
    { orderStatus: status, updatedBy, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
}

const cancelOrder = async (orderId, cancelReason, updatedBy) => {
  return await orderModel.findByIdAndUpdate(
    orderId,
    {
      orderStatus: ORDER_STATUS.CANCELED,
      cancelReason,
      updatedBy,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  )
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
}

/**
 * Find pending VNPay orders older than the given age in ms (default 30 min)
 */
const findExpiredPendingVNPayOrders = async (maxAgeMs = 30 * 60 * 1000) => {
  const expiredBefore = new Date(Date.now() - maxAgeMs)
  return await orderModel
    .find({
      orderStatus: ORDER_STATUS.PENDING,
      paymentMethod: 'vnpay',
      createdAt: { $lt: expiredBefore }
    })
    .select('_id orderNumber user branch items orderStatus paymentMethod createdAt')
    .lean()
}

const countOrdersByStatus = async (userId = null) => {
  const matchStage = userId ? { user: userId } : {}

  return await orderModel.aggregate([
    { $match: matchStage },
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
  ])
}

export const ORDER_REPOSITORY = {
  createOrder,
  getOrderById,
  getOrderByOrderNumber,
  getOrdersByUser,
  getAllOrders,
  updateOrderById,
  updateOrderStatus,
  cancelOrder,
  countOrdersByStatus,
  findExpiredPendingVNPayOrders
}
