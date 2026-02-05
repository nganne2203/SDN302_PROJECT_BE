import { deviceModel } from '#models/deviceModel.js'

const createDevice = async (data) => {
  return await deviceModel.create(data)
}

const getAllDevices = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  return await deviceModel.paginate({ ...filter, isDeleted }, {
    page,
    limit,
    sort
  })
}

const updateDeviceById = async (id, data) => {
  return await deviceModel.findByIdAndUpdate(id, data, { new: true, runValidators: true, timestamps: true })
}

const deleteDeviceById = async (id) => {
  return await deviceModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
}

const getDeviceById = async (id) => {
  return await deviceModel.findOne({ _id: id, isDeleted: false })
}

const getDeviceByName = async (name) => {
  return await deviceModel.findOne({ name, isDeleted: false })
}

export const DEVICE_REPOSITORY = {
  createDevice,
  getAllDevices,
  updateDeviceById,
  deleteDeviceById,
  getDeviceById,
  getDeviceByName
}