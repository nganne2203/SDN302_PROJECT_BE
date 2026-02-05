import { ERROR_CODES } from '#constants/errorCode.js'
import { CATEGORY_REPOSITORY } from '#repositories/categoryRepository.js'
import ApiError from '#utils/ApiError.js'
import { escapeRegex, slugify } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'

const getCategoryById = async (categoryId) => {
  const category = await CATEGORY_REPOSITORY.getCategoryById(categoryId)
  if (!category) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Danh mục không tồn tại'])
  return category
}

const getAllCategories = async (query = {}) => {
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

  const result = await CATEGORY_REPOSITORY.getAllCategories(filter, {
    page,
    limit,
    sort
  })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const assertCategoryNameUnique = async (name) => {
  const existingCategory = await CATEGORY_REPOSITORY.getCategoryByName(name)
  if (existingCategory) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tên danh mục đã được sử dụng'])
  }
}

const createCategory = async (data, createdBy = null) => {
  const { name, description = '' } = data
  await assertCategoryNameUnique(name)
  return await CATEGORY_REPOSITORY.createCategory({ name, description, slug: slugify(name), createdBy })
}

const updateCategoryById = async (categoryId, data, updatedBy = null) => {
  const category = await getCategoryById(categoryId)
  const { name, description } = data
  const updatedCategoryData = {}
  if (name && name !== category.name) {
    await assertCategoryNameUnique(name)
    updatedCategoryData.name = name
    updatedCategoryData.slug = slugify(name)
  }
  if (description !== undefined) {
    updatedCategoryData.description = description
  }
  return CATEGORY_REPOSITORY.updateCategoryById(categoryId, { ...updatedCategoryData, updatedBy })
}

const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId)
  if (!category.isActive)
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ có thể xóa danh mục đang hoạt động'])
  if (category.isDeleted)
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Danh mục đã bị xóa'])
  return CATEGORY_REPOSITORY.deleteCategoryById(categoryId)
}

const updateCategoryStatus = async (categoryId, isActive, updatedBy = null) => {
  await getCategoryById(categoryId)
  if (typeof isActive !== 'boolean') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái không hợp lệ'])
  }
  return CATEGORY_REPOSITORY.updateCategoryById(categoryId, { isActive, updatedBy })
}

export const CATEGORY_SERVICE = {
  getCategoryById,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  updateCategoryStatus,
  getAllCategories
}