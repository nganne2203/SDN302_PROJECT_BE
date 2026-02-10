import { productModel } from '#models/productModel.js'

const getProductById = async (id) => {
  return await productModel.findById(id, { isDeleted: false })
    .populate('category', 'name')
    .populate('compatibility', 'name')
}

const getProductByName = async (name) => {
  return await productModel.findOne({ name, isDeleted: false })
}

const getProductBySlug = async (slug) => {
  return await productModel.findOne({ slug, isDeleted: false })
}

const getAllProducts = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  return await productModel.paginate({ ...filter, isDeleted }, {
    page,
    limit,
    sort,
    populate: [
      { path: 'category', select: 'name' },
      { path: 'compatibility', select: 'name' }
    ]
  })
}

const getAllProductsWithoutPagination = async (filter = {}, sort = { createdAt: -1 }) => {
  return await productModel.find({ ...filter, isDeleted: false })
    .sort(sort)
    .populate('category', 'name')
    .populate('compatibility', 'name')
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
  return await productModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true, runValidators: true, timestamps: true })
}

export const PRODUCT_REPOSITORY = {
  getProductById,
  getProductByName,
  getProductBySlug,
  getAllProducts,
  createProduct,
  updateProductById,
  deleteProductById,
  getAllProductsWithoutPagination
}
