import { categoryModel } from '#models/categoryModel.js'

const getCategoryById = async (id) => {
  return await categoryModel.findById(id)
}

const getAllCategories = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  return await categoryModel.paginate(filter, {
    page,
    limit,
    sort
  })
}

const getCategoryByName = async (name) => {
  return await categoryModel.findOne({ name })
}

const createCategory = async (data) => {
  return await categoryModel.create(data)
}

const updateCategoryById = async (id, data) => {
  return await categoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true, timestamps: true })
}

const deleteCategoryById = async (id) => {
  return await categoryModel.findByIdAndDelete(id)
}

export const CATEGORY_REPOSITORY = {
  getCategoryById,
  getAllCategories,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  getCategoryByName
}

