import { serviceModel } from '#models/serviceModel.js'
import { productModel } from '#models/productModel.js'

const findServiceByNameInProduct = async (name, productId) => {
  return await serviceModel.findOne({ name, product: productId, isDeleted: false })
}

const createService = async (data) => {
  return await serviceModel.create(data)
}

const findAllServices = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  return await serviceModel.paginate({ ...filter, isDeleted }, {
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

const findAllServicesWithoutPagination = async (filter = {}, sort = { createdAt: -1 }) => {
  return await serviceModel.find({ ...filter, isDeleted: false }).sort(sort).populate([
    {
      path: 'product',
      select: 'name images price'
    }
  ])
}

const findServiceByProductId = async (productId) => {
  return await serviceModel.find({ product: productId, isDeleted: false }, { product: 0 })
}

const findByIdProduct = async (id) => {
  return await productModel.findById(id, { isDeleted: false })
}

const findByIdService = async (id) => {
  return await serviceModel.findById(id, { product: 0, isDeleted: false })
}

const updateServiceById = async (serviceId, data) => {
  return await serviceModel.findByIdAndUpdate(serviceId, data, { new: true, runValidators: true, timestamps: true })
}

const deleteServiceById = async (serviceId) => {
  return await serviceModel.findByIdAndUpdate(serviceId, { isDeleted: true }, { new: true, runValidators: true, timestamps: true })
}

export const SERVICE_REPOSITORY = {
  createService,
  findServiceByNameInProduct,
  findAllServices,
  findAllServicesWithoutPagination,
  findServiceByProductId,
  findByIdProduct,
  findByIdService,
  updateServiceById,
  deleteServiceById
}
