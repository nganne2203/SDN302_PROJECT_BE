import { PRODUCT_REPOSITORY } from '#repositories/productRepository.js'
import { CATEGORY_REPOSITORY } from '#repositories/categoryRepository.js'
import { UPLOAD_SERVICE } from '#services/uploadService.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { escapeRegex, slugify } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { DEVICE_SERVICE } from '#services/deviceService.js'

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

export const PRODUCT_SERVICE = {
  getProductById,
  getAllProducts,
  searchProducts,
  createProduct,
  updateProductById,
  deleteProductById,
  updateProductStatus,
  getProductCategories
}
