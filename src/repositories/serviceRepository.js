import { serviceModel } from '#models/serviceModel.js'
import { productModel } from '#models/productModel.js'

const findServiceByNameInProduct = async (name, productId) => {
  return await serviceModel.findOne({ name, product: productId })
}

const createService = async (data) => {
  return await serviceModel.create(data)
}

const findAllServices = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  return await serviceModel.paginate(filter, {
    page,
    limit,
    sort,
    populate: [
      {
        path: 'product',
        select: 'name images price'
      }
    ]
  })
}

const findServiceByProductId = async (productId) => {
  return await serviceModel.find({ product: productId }, { product: 0 })
}

const findByIdProduct = async (id) => {
  return await productModel.findById(id)
}

const findByIdService = async (id) => {
  return await serviceModel.findById(id, { product: 0 })
}

const updateServiceById = async (serviceId, data) => {
  return await serviceModel.findByIdAndUpdate(serviceId, data, { new: true, runValidators: true, timestamps: true })
}

const deleteServiceById = async (serviceId) => {
  return await serviceModel.findByIdAndDelete(serviceId)
}

export const SERVICE_REPOSITORY = {
  createService,
  findServiceByNameInProduct,
  findAllServices,
  findServiceByProductId,
  findByIdProduct,
  findByIdService,
  updateServiceById,
  deleteServiceById
}
