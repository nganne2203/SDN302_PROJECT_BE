import { DEVICE_REPOSITORY } from '#repositories/deviceRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'

const getDeviceById = async (deviceId) => {
  const device = await DEVICE_REPOSITORY.getDeviceById(deviceId)
  if (!device) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Thiết bị không tồn tại'])
  return device
}

const createDevice = async (data, createdBy = null) => {
  const user = await USER_REPOSITORY.getUserById(createdBy)
  if (!user) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người tạo không tồn tại'])

  const { name, type, brand, model } = data
  const existingDevice = await DEVICE_REPOSITORY.getDeviceByName(name)
  if (existingDevice) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tên thiết bị đã tồn tại'])
  const newDevice = await DEVICE_REPOSITORY.createDevice({
    name,
    type,
    brand,
    model,
    createdBy: user._id
  })
  return newDevice
}

const updateDevice = async (deviceId, data, updatedBy = null) => {
  const { name, type, brand, model } = data

  const device = await DEVICE_REPOSITORY.getDeviceById(deviceId)
  if (!device) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Thiết bị không tồn tại'])
  const user = await USER_REPOSITORY.getUserById(updatedBy)
  if (!user) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người cập nhật không tồn tại'])
  const updatedDevice = {}
  if (name && name !== device.name) {
    const existingDevice = await DEVICE_REPOSITORY.getDeviceByName(name)
    if (existingDevice) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tên thiết bị đã tồn tại'])
    updatedDevice.name = name
  }
  if (type) updatedDevice.type = type
  if (brand) updatedDevice.brand = brand
  if (model) updatedDevice.model = model
  updatedDevice.updatedBy = user._id

  return DEVICE_REPOSITORY.updateDeviceById(deviceId, updatedDevice)
}

const updateDeviceStatus = async (deviceId, isActive, updatedBy = null) => {
  const device = await DEVICE_REPOSITORY.getDeviceById(deviceId)
  if (!device) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Thiết bị không tồn tại'])
  const user = await USER_REPOSITORY.getUserById(updatedBy)
  if (!user) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người cập nhật không tồn tại'])

  if (typeof isActive !== 'boolean') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái thiết bị không hợp lệ'])
  }
  const updatedDevice = {
    isActive,
    updatedBy: user._id
  }
  return DEVICE_REPOSITORY.updateDeviceById(deviceId, updatedDevice)
}

const deleteDevice = async (deviceId) => {
  const device = await DEVICE_REPOSITORY.getDeviceById(deviceId)
  if (!device) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Thiết bị không tồn tại'])
  return DEVICE_REPOSITORY.deleteDeviceById(deviceId)
}

const getAllDevices = async (query = {}) => {
  const { page, limit, search, isActive, sortBy, sortOrder } = query
  const filter = {}
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { brand: { $regex: escapedSearch, $options: 'i' } },
      { model: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await DEVICE_REPOSITORY.getAllDevices(filter, {
    page,
    limit,
    sort
  })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

export const DEVICE_SERVICE = {
  getDeviceById,
  createDevice,
  updateDevice,
  updateDeviceStatus,
  deleteDevice,
  getAllDevices
}