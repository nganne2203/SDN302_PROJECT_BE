import { DEVICE_SERVICE } from '#services/deviceService.js'
import { StatusCodes } from 'http-status-codes'
import { responseSuccess } from '#utils/responseUtil.js'

const createDevice = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await DEVICE_SERVICE.createDevice(req.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const getAllDevices = async (req, res, next) => {
  try {
    const result = await DEVICE_SERVICE.getAllDevices(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const getAllDevicesWithoutPagination = async (req, res, next) => {
  try {
    const result = await DEVICE_SERVICE.getAllDevicesWithoutPagination(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy danh sách thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const getDeviceById = async (req, res, next) => {
  try {
    const result = await DEVICE_SERVICE.getDeviceById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const updateDevice = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await DEVICE_SERVICE.updateDevice(req.params.id, req.body, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const updateDeviceStatus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await DEVICE_SERVICE.updateDeviceStatus(req.params.id, req.body.isActive, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật trạng thái thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const deleteDevice = async (req, res, next) => {
  try {
    await DEVICE_SERVICE.deleteDevice(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: 'Xóa thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

export const DEVICE_CONTROLLER = {
  createDevice,
  getAllDevices,
  getAllDevicesWithoutPagination,
  getDeviceById,
  updateDevice,
  updateDeviceStatus,
  deleteDevice
}