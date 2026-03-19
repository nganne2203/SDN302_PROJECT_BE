import { orderModel } from '#models/orderModel.js'
import { DELIVERY_STATUS, ORDER_STATUS } from '#constants/orderConstant.js'

const createOrder = async (orderData, options = {}) => {
  const { session } = options
  const order = new orderModel(orderData)
  return await order.save({ session })
}

const getOrderById = async (orderId, options = {}) => {
  const { populate = true, session = null } = options
  let query = orderModel.findById(orderId)
  if (session) query = query.session(session)

  if (populate) {
    query = query
      .populate('user', 'fullname email phone')
      .populate('items.product', 'name price images slug category')
      .populate('items.services.service', 'name type price')
      .populate('branch', 'name address phone')
      .populate('payment', 'status paidAt method provider amount currency')
      .populate('createdBy', 'fullname email phone')
      .populate('updatedBy', 'fullname email phone')
  }

  return await query.exec()
}

const getOrderByOrderNumber = async (orderNumber, options = {}) => {
  const { populate = true, session = null } = options
  let query = orderModel.findOne({ orderNumber })
  if (session) query = query.session(session)

  if (populate) {
    query = query
      .populate('user', 'fullname email phone')
      .populate('items.product', 'name price images slug category')
      .populate('items.services.service', 'name type price')
      .populate('branch', 'name address phone')
      .populate('payment', 'status paidAt method provider amount currency')
      .populate('createdBy', 'fullname email phone')
      .populate('updatedBy', 'fullname email phone')
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
      { path: 'branch', select: 'name address phone' },
      { path: 'payment', select: 'status paidAt method provider amount currency' }
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
      { path: 'payment', select: 'status paidAt method provider amount currency' },
      { path: 'createdBy', select: 'fullname email phone' },
      { path: 'updatedBy', select: 'fullname email phone' }
    ]
  })
}

const updateOrderById = async (orderId, updateData, options = {}) => {
  const { session = null } = options
  return await orderModel.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true, runValidators: true, session }
  )
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
    .populate('payment', 'status paidAt method provider amount currency')
    .populate('createdBy', 'fullname email phone')
    .populate('updatedBy', 'fullname email phone')
}

const ORDER_STATUS_TO_DELIVERY_STATUS = {
  pending: 'pending',
  confirmed: 'pending',
  shipped: 'shipping',
  delivered: 'delivered',
  cancelled: DELIVERY_STATUS.CANCELLED
}

const updateOrderStatus = async (orderId, status, updatedBy) => {
  return await updateOrderStatusWithOptions(orderId, status, updatedBy)
}

const updateOrderStatusIfNotCancelled = async (orderId, status, updatedBy, options = {}) => {
  const { session = null } = options
  const deliveryStatus = ORDER_STATUS_TO_DELIVERY_STATUS[status]
  const updateFields = { orderStatus: status, updatedBy, updatedAt: new Date() }
  if (deliveryStatus) {
    updateFields['delivery.status'] = deliveryStatus
  }
  if (status === ORDER_STATUS.DELIVERED) {
    updateFields['delivery.deliveredAt'] = new Date()
  }

  return await orderModel.findOneAndUpdate(
    { _id: orderId, orderStatus: { $ne: ORDER_STATUS.CANCELLED } },
    updateFields,
    { new: true, runValidators: true, session }
  )
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
    .populate('payment', 'status paidAt method provider amount currency')
}

const updateOrderStatusWithOptions = async (orderId, status, updatedBy, options = {}) => {
  const { session = null } = options
  const deliveryStatus = ORDER_STATUS_TO_DELIVERY_STATUS[status]
  const updateFields = { orderStatus: status, updatedBy, updatedAt: new Date() }
  if (deliveryStatus) {
    updateFields['delivery.status'] = deliveryStatus
  }
  if (status === ORDER_STATUS.DELIVERED) {
    updateFields['delivery.deliveredAt'] = new Date()
  }
  return await orderModel.findByIdAndUpdate(orderId, updateFields, { new: true, runValidators: true, session })
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
    .populate('payment', 'status paidAt method provider amount currency')
}

const cancelOrder = async (orderId, cancelReason, updatedBy, options = {}) => {
  const { session = null } = options
  return await orderModel.findOneAndUpdate(
    { _id: orderId, orderStatus: { $ne: ORDER_STATUS.CANCELLED } },
    {
      $set: {
        orderStatus: ORDER_STATUS.CANCELLED,
        cancelReason,
        updatedBy,
        updatedAt: new Date(),
        'delivery.status': DELIVERY_STATUS.CANCELLED
      }
    },
    { new: true, runValidators: true, session }
  )
    .populate('user', 'fullname email phone')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
    .populate('branch', 'name address phone')
    .populate('payment', 'status paidAt method provider amount currency')
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

const hasDeliveredOrderWithProduct = async (userId, productId) => {
  const query = {
    user: userId,
    'items.product': productId,
    $or: [
      { orderStatus: ORDER_STATUS.DELIVERED },
      { 'delivery.status': 'delivered' }
    ]
  }

  return await orderModel.exists(query)
}

export const ORDER_REPOSITORY = {
  createOrder,
  getOrderById,
  getOrderByOrderNumber,
  getOrdersByUser,
  getAllOrders,
  updateOrderById,
  updateOrderStatus,
  updateOrderStatusIfNotCancelled,
  updateOrderStatusWithOptions,
  cancelOrder,
  countOrdersByStatus,
  findExpiredPendingVNPayOrders,
  hasDeliveredOrderWithProduct
}
