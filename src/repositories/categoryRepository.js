import { categoryModel } from '#models/categoryModel.js'

const getCategoryById = async (id) => {
  return await categoryModel.findById(id, { isDeleted: false })
}

const getAllCategories = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  return await categoryModel.paginate({ ...filter, isDeleted }, {
    page,
    limit,
    sort
  })
}

const getCategoryByName = async (name) => {
  return await categoryModel.findOne({ name, isDeleted: false })
}

const createCategory = async (data) => {
  return await categoryModel.create(data)
}

const updateCategoryById = async (id, data) => {
  return await categoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true, timestamps: true })
}

const deleteCategoryById = async (id) => {
  return await categoryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true, runValidators: true, timestamps: true })
}

const getAllCategoriesWithoutPagination = async (filter = {}, sort = { name: 1 }) => {
  return await categoryModel.find({ ...filter, isDeleted: false }).sort(sort)
}

export const CATEGORY_REPOSITORY = {
  getCategoryById,
  getAllCategories,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  getCategoryByName,
  getAllCategoriesWithoutPagination
}

