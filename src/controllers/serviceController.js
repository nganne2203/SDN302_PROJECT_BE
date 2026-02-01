import { SERVICE_SERVICE } from '#services/serviceService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const createService = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await SERVICE_SERVICE.createService(req.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo dịch vụ thành công'
    }))
  } catch (error) { next(error) }
}

const getAllServices = async (req, res, next) => {
  try {
    const result = await SERVICE_SERVICE.getAllServices(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách dịch vụ thành công'
    }))
  } catch (error) { next(error) }
}

const getServiceById = async (req, res, next) => {
  try {
    const result = await SERVICE_SERVICE.getServiceById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin dịch vụ thành công'
    }))
  } catch (error) { next(error) }
}

const getServiceByProductId = async (req, res, next) => {
  try {
    const result = await SERVICE_SERVICE.getServiceByProductId(req.params.productId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy danh sách dịch vụ theo sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const updateService = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await SERVICE_SERVICE.updateServiceById(req.params.id, req.body, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật dịch vụ thành công'
    }))
  } catch (error) { next(error) }
}

const updateServiceStatus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await SERVICE_SERVICE.updateServiceStatus(req.params.id, req.body.isActive, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật trạng thái dịch vụ thành công'
    }))
  } catch (error) { next(error) }
}

const deleteServiceById = async (req, res, next) => {
  try {
    await SERVICE_SERVICE.deleteServiceById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      message: 'Xóa dịch vụ thành công'
    }))
  } catch (error) { next(error) }
}

export const SERVICE_CONTROLLER = {
  createService,
  getAllServices,
  getServiceById,
  getServiceByProductId,
  updateService,
  updateServiceStatus,
  deleteServiceById
}