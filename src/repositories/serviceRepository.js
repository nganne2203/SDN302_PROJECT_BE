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
  const result = await serviceModel.paginate(
    { ...filter, isDeleted },
    {
      page,
      limit,
      sort,
      populate: [
        {
          path: 'product',
          select: 'name images price'
        }
      ]
    }
  )

  result.docs = result.docs.map(service => {
    const serviceObj = service.toObject()

    if (serviceObj.product && serviceObj.product.images) {
      serviceObj.product.images = serviceObj.product.images.map(img =>
        typeof img === 'string'
          ? {
            publicId: img,
            imageUrl: `https://res.cloudinary.com/djmbxvsaz/image/upload/uploads/${img}`
          }
          : img
      )
    }

    return serviceObj
  })

  return result
}

const findAllServicesWithoutPagination = async (filter = {}, sort = { createdAt: -1 }) => {
  const services = await serviceModel
    .find({ ...filter, isDeleted: false })
    .sort(sort)
    .populate({
      path: 'product',
      select: 'name images price'
    })

  return services.map(service => {
    const serviceObj = service.toObject()

    if (serviceObj.product && serviceObj.product.images) {
      serviceObj.product.images = serviceObj.product.images.map(img =>
        typeof img === 'string'
          ? {
            publicId: img,
            imageUrl: `https://res.cloudinary.com/djmbxvsaz/image/upload/uploads/${img}`
          }
          : img
      )
    }

    return serviceObj
  })
}

const findServiceByProductId = async (productId) => {
  return await serviceModel.find({ product: productId, isDeleted: false }, { product: 0 })
}

const findByIdProduct = async (id) => {
  return await productModel.findOne({ _id: id, isDeleted: false })
}

const findByIdService = async (serviceId) => {
  return await serviceModel.findOne({ _id: serviceId, isDeleted: false })
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
