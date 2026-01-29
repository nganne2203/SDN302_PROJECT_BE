import { productModel } from '#models/productModel.js'

const getProductById = async (id) => {
  return await productModel.findById(id)
    .populate('category', 'name')
    .populate('compatibility', 'name')
}

const getProductByName = async (name) => {
  return await productModel.findOne({ name })
}

const getProductBySlug = async (slug) => {
  return await productModel.findOne({ slug })
}

const getAllProducts = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  return await productModel.paginate(filter, {
    page,
    limit,
    sort,
    populate: [
      { path: 'category', select: 'name' },
      { path: 'compatibility', select: 'name' }
    ]
  })
}

const createProduct = async (data) => {
  return await productModel.create(data)
}

const updateProductById = async (id, data) => {
  return await productModel.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true, timestamps: true }
  ).populate('category', 'name').populate('compatibility', 'name')
}

const deleteProductById = async (id) => {
  return await productModel.findByIdAndDelete(id)
}

export const PRODUCT_REPOSITORY = {
  getProductById,
  getProductByName,
  getProductBySlug,
  getAllProducts,
  createProduct,
  updateProductById,
  deleteProductById
}
