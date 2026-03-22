import { ORDER_SERVICE } from '#services/orderService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id
    const order = await ORDER_SERVICE.createOrder(userId, req.body)
    res.status(StatusCodes.CREATED).json(
      responseSuccess({
        data: order,
        message: 'Tạo đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const previewCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id
    const preview = await ORDER_SERVICE.previewCheckout(userId, req.body)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: preview,
        message: 'Lấy thông tin đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const order = await ORDER_SERVICE.getOrderById(orderId, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: order,
        message: 'Lấy thông tin đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const getOrderByOrderNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params
    const order = await ORDER_SERVICE.getOrderByOrderNumber(orderNumber, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: order,
        message: 'Lấy thông tin đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await ORDER_SERVICE.getMyOrders(userId, req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const getAllOrders = async (req, res, next) => {
  try {
    const result = await ORDER_SERVICE.getAllOrders(req.validated.query, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { status } = req.body
    const order = await ORDER_SERVICE.updateOrderStatus(orderId, status, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: order,
        message: 'Cập nhật trạng thái đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const updateShippingFee = async (req, res, next) => {
  try {
    const updatedBy = req.user.id
    const { orderId } = req.params
    const { shippingFee } = req.body
    const order = await ORDER_SERVICE.updateShippingFee(orderId, shippingFee, updatedBy)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: order,
        message: 'Cập nhật phí ship thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { cancelReason } = req.body
    const order = await ORDER_SERVICE.cancelOrder(orderId, req.user, cancelReason)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: order,
        message: 'Hủy đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const updateDeliveryInfo = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const order = await ORDER_SERVICE.updateDeliveryInfo(orderId, req.body, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: order,
        message: 'Cập nhật thông tin vận chuyển thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const getOrderStatistics = async (req, res, next) => {
  try {
    const userId = req.user.role === 'customer' ? req.user.id : null
    const stats = await ORDER_SERVICE.getOrderStatistics(userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: stats,
        message: 'Lấy thống kê đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const createOfflineOrder = async (req, res, next) => {
  try {
    const staffId = req.user.id
    const order = await ORDER_SERVICE.createOfflineOrder(staffId, req.body)
    res.status(StatusCodes.CREATED).json(
      responseSuccess({
        data: order,
        message: 'Tạo đơn hàng offline thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const ORDER_CONTROLLER = {
  createOrder,
  previewCheckout,
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
