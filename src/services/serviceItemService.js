import { SERVICE_REPOSITORY } from '#repositories/serviceRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import mongoose from 'mongoose'

const assertProductExists = async (productId) => {
  const existingProduct = await SERVICE_REPOSITORY.findByIdProduct(productId)
  if (!existingProduct) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không tìm thấy sản phẩm'])
  }
}

const assertServiceNameUnique = async (name, productId) => {
  const existingService = await SERVICE_REPOSITORY.findServiceByNameInProduct(name, productId)
  if (existingService) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không được tạo dịch vụ có tên đã tồn tại trong sản phẩm'])
  }
}

const createService = async (data, createdBy = null) => {
  const { name, description, product, type, price } = data
  await assertProductExists(product)
  await assertServiceNameUnique(name, product)
  return await SERVICE_REPOSITORY.createService({ name, description, product, type, price, createdBy })
}

const getAllServices = async (query = {}) => {
  const { page, limit, search, isActive, sortBy, sortOrder } = query
  const filter = {}
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }
  const result = await SERVICE_REPOSITORY.findAllServices(filter, {
    page,
    limit,
    sort
  })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const getAllServicesWithoutPagination = async (query = {}) => {
  const { search, isActive, sortBy, sortOrder } = query
  const filter = {}
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  return await SERVICE_REPOSITORY.findAllServicesWithoutPagination(filter, sort)
}

const getServiceById = async (serviceId) => {
  const normalizedServiceId = typeof serviceId === 'string'
    ? serviceId.trim()
    : serviceId?.toString?.().trim()
    console.log("serviceId nhận được:", serviceId)
  console.log("normalizedServiceId:", normalizedServiceId)

  if (!normalizedServiceId) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, ['Service ID là bắt buộc'])
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedServiceId)) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, ['Service ID không hợp lệ'])
  }
  console.log("Query DB với id:", normalizedServiceId)

  const service = await SERVICE_REPOSITORY.findByIdService(normalizedServiceId)
  console.log("Service tìm được:", service)
  if (!service) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy dịch vụ'])
  }
  return service
}

const getServiceByProductId = async (productId) => {
  await assertProductExists(productId)
  return await SERVICE_REPOSITORY.findServiceByProductId(productId)
}

const updateServiceById = async (serviceId, data, updatedBy = null) => {
  const service = await getServiceById(serviceId)
  const { name, description, type, price } = data
  const updatedServiceData = {}

  if (name && name !== service.name) {
    await assertServiceNameUnique(name, service.product)
    updatedServiceData.name = name
  }

  if (description !== undefined) {
    updatedServiceData.description = description
  }

  if (type !== undefined) {
    updatedServiceData.type = type
  }

  if (price !== undefined) {
    updatedServiceData.price = price
  }
  return SERVICE_REPOSITORY.updateServiceById(serviceId, { ...updatedServiceData, updatedBy })
}

const updateServiceStatus = async (serviceId, isActive, updatedBy = null) => {
  await getServiceById(serviceId)
  if (typeof isActive !== 'boolean') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái không hợp lệ'])
  }
  return SERVICE_REPOSITORY.updateServiceById(serviceId, { isActive, updatedBy })
}

const deleteServiceById = async (serviceId) => {
  const service = await getServiceById(serviceId)
  if (service.isActive)
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ có thể xóa dịch vụ không hoạt động'])
  return SERVICE_REPOSITORY.deleteServiceById(serviceId)
}

export const SERVICE_ITEM_SERVICE = {
  createService,
  getAllServices,
  getAllServicesWithoutPagination,
  getServiceById,
  getServiceByProductId,
  updateServiceById,
  updateServiceStatus,
  deleteServiceById
}