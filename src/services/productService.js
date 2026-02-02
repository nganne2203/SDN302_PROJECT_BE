import { PRODUCT_REPOSITORY } from '#repositories/productRepository.js'
import { CATEGORY_REPOSITORY } from '#repositories/categoryRepository.js'
import { UPLOAD_SERVICE } from '#services/uploadService.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { escapeRegex, slugify } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { DEVICE_SERVICE } from '#services/deviceService.js'
import { storeInventoryModel } from '#models/storeInventoryModel.js'
import { pricingModel } from '#models/pricingModel.js'

const getProductById = async (productId) => {
  const product = await PRODUCT_REPOSITORY.getProductById(productId)
  if (!product) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại'])
  return product
}

const getAllProducts = async (query = {}) => {
  const { page, limit, search, categoryId, minPrice, maxPrice, isActive, sortBy, sortOrder } = query
  const filter = {}

  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  if (categoryId) {
    filter.category = categoryId
  }

  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {}
    if (minPrice !== undefined) filter.price.$gte = minPrice
    if (maxPrice !== undefined) filter.price.$lte = maxPrice
  }

  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await PRODUCT_REPOSITORY.getAllProducts(filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const searchProducts = async (query = {}) => {
  const { q, page, limit, sortBy, sortOrder } = query
  const search = q || ''
  return await getAllProducts({ search, page, limit, sortBy, sortOrder })
}

const assertProductNameUnique = async (name) => {
  const existingProduct = await PRODUCT_REPOSITORY.getProductByName(name)
  if (existingProduct) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tên sản phẩm đã được sử dụng'])
  }
}

const assertCategoryExists = async (categoryId) => {
  const category = await CATEGORY_REPOSITORY.getCategoryById(categoryId)
  if (!category) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Danh mục không tồn tại'])
}

const createProduct = async (data, createdBy = null) => {
  const { name, description = '', categoryId, price, images = [], material = '', compatibility = [] } = data
  await assertProductNameUnique(name)
  await assertCategoryExists(categoryId)
  if (compatibility.length > 0) {
    for (const deviceId of compatibility) {
      await DEVICE_SERVICE.getDeviceById(deviceId)
    }
  }

  return await PRODUCT_REPOSITORY.createProduct({
    name,
    slug: slugify(name),
    description,
    category: categoryId,
    price,
    images,
    material,
    compatibility,
    createdBy
  })
}

const updateProductById = async (productId, data, updatedBy = null) => {
  const product = await getProductById(productId)
  const { name, description, categoryId, price, images = [], material, compatibility = [] } = data
  const updatedData = {}

  if (name && name !== product.name) {
    await assertProductNameUnique(name)
    updatedData.name = name
    updatedData.slug = slugify(name)
  }

  if (description !== undefined) {
    updatedData.description = description
  }

  if (categoryId && String(categoryId) !== String(product.category?._id || product.category)) {
    await assertCategoryExists(categoryId)
    updatedData.category = categoryId
  }

  if (price !== undefined) {
    updatedData.price = price
  }

  if (images !== undefined) {
    const oldImages = product.images || []
    const newImages = images || []
    const imagesToDelete = oldImages.filter(img => !newImages.includes(img))
    if (imagesToDelete.length > 0) {
      await UPLOAD_SERVICE.deleteImagesFromCloudinary(imagesToDelete)
    }
    updatedData.images = newImages
  }

  if (material !== undefined) {
    updatedData.material = material
  }

  if (compatibility !== undefined) {
    if (compatibility.length > 0) {
      for (const deviceId of compatibility) {
        await DEVICE_SERVICE.getDeviceById(deviceId)
      }
    }
    updatedData.compatibility = compatibility
  }

  return PRODUCT_REPOSITORY.updateProductById(productId, { ...updatedData, updatedBy })
}

const deleteProductById = async (productId) => {
  const product = await getProductById(productId)
  if (!product.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ có thể xóa sản phẩm đang hoạt động'])
  }

  if (product.images && product.images.length > 0) {
    await UPLOAD_SERVICE.deleteImagesFromCloudinary(product.images)
  }

  return PRODUCT_REPOSITORY.deleteProductById(productId)
}

const updateProductStatus = async (productId, isActive, updatedBy = null) => {
  await getProductById(productId)
  if (typeof isActive !== 'boolean') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái không hợp lệ'])
  }
  return PRODUCT_REPOSITORY.updateProductById(productId, { isActive, updatedBy })
}

const getProductCategories = async () => {
  const result = await CATEGORY_REPOSITORY.getAllCategoriesWithoutPagination({ isActive: true }, { name: 1 })
  return result.map((item) => ({
    id: item._id,
    name: item.name
  }))
}

/**
 * Get product by slug (for SEO-friendly URLs)
 */
const getProductBySlug = async (slug) => {
  const product = await PRODUCT_REPOSITORY.getProductBySlug(slug)
  if (!product) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại'])
  return product
}

/**
 * Get products with stock availability info
 */
const getProductsWithStock = async (query = {}) => {
  const { page, limit, search, categoryId, minPrice, maxPrice, sortBy, sortOrder } = query
  const filter = { isActive: true }

  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  if (categoryId) {
    filter.category = categoryId
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {}
    if (minPrice !== undefined) filter.price.$gte = minPrice
    if (maxPrice !== undefined) filter.price.$lte = maxPrice
  }

  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await PRODUCT_REPOSITORY.getAllProducts(filter, { page, limit, sort })

  // Get stock info for each product
  const productsWithStock = await Promise.all(result.docs.map(async (product) => {
    const stockInfo = await storeInventoryModel.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, totalStock: { $sum: '$quantity' } } }
    ])

    const totalStock = stockInfo.length > 0 ? stockInfo[0].totalStock : 0

    // Get active pricing rules
    const pricingRules = await pricingModel.find({
      product: product._id,
      isActive: true
    }).sort({ minQuantity: 1 })

    return {
      ...product.toObject(),
      totalStock,
      inStock: totalStock > 0,
      pricingRules: pricingRules.map(rule => ({
        minQuantity: rule.minQuantity,
        maxQuantity: rule.maxQuantity,
        discountPercentage: rule.discountPercentage
      }))
    }
  }))

  return {
    data: productsWithStock,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Get products by device compatibility
 */
const getProductsByDevice = async (deviceId, query = {}) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query

  // Verify device exists
  await DEVICE_SERVICE.getDeviceById(deviceId)

  const filter = {
    compatibility: deviceId,
    isActive: true
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const result = await PRODUCT_REPOSITORY.getAllProducts(filter, { page, limit, sort })

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Get featured/popular products (top rated or most sold)
 */
const getFeaturedProducts = async (query = {}) => {
  const { limit = 8 } = query

  const filter = { isActive: true }
  const sort = { ratingAvg: -1, ratingCount: -1 }

  const result = await PRODUCT_REPOSITORY.getAllProducts(filter, { page: 1, limit, sort })

  return result.docs
}

/**
 * Get new arrivals (latest products)
 */
const getNewArrivals = async (query = {}) => {
  const { limit = 8 } = query

  const filter = { isActive: true }
  const sort = { createdAt: -1 }

  const result = await PRODUCT_REPOSITORY.getAllProducts(filter, { page: 1, limit, sort })

  return result.docs
}

/**
 * Get related products (same category)
 */
const getRelatedProducts = async (productId, query = {}) => {
  const { limit = 4 } = query

  const product = await getProductById(productId)

  const filter = {
    category: product.category._id || product.category,
    _id: { $ne: productId },
    isActive: true
  }

  const result = await PRODUCT_REPOSITORY.getAllProducts(filter, { page: 1, limit, sort: { ratingAvg: -1 } })

  return result.docs
}

/**
 * Get product detail with full info for ordering
 */
const getProductDetailForOrder = async (productId) => {
  const product = await getProductById(productId)

  if (!product.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Sản phẩm hiện không khả dụng'])
  }

  // Get stock info
  const stockInfo = await storeInventoryModel.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: null, totalStock: { $sum: '$quantity' } } }
  ])

  const totalStock = stockInfo.length > 0 ? stockInfo[0].totalStock : 0

  // Get pricing rules
  const pricingRules = await pricingModel.find({
    product: product._id,
    isActive: true
  }).sort({ minQuantity: 1 })

  // Get stock by branch
  const stockByBranch = await storeInventoryModel.find({ product: product._id })
    .populate('branch', 'name address')
    .select('branch quantity')

  return {
    ...product.toObject(),
    totalStock,
    inStock: totalStock > 0,
    pricingRules: pricingRules.map(rule => ({
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity,
      discountPercentage: rule.discountPercentage,
      discountedPrice: product.price * (1 - rule.discountPercentage / 100)
    })),
    stockByBranch: stockByBranch.map(inv => ({
      branch: inv.branch,
      quantity: inv.quantity,
      inStock: inv.quantity > 0
    }))
  }
}

export const PRODUCT_SERVICE = {
  getProductById,
  getAllProducts,
  searchProducts,
  createProduct,
  updateProductById,
  deleteProductById,
  updateProductStatus,
  getProductCategories,
  getProductBySlug,
  getProductsWithStock,
  getProductsByDevice,
  getFeaturedProducts,
  getNewArrivals,
  getRelatedProducts,
  getProductDetailForOrder
}