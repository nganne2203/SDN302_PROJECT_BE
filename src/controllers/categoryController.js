import { StatusCodes } from 'http-status-codes'
import { CATEGORY_SERVICE } from '#services/categoryService.js'
import { responseSuccess } from '#utils/responseUtil.js'

const getCategoryById = async (req, res, next) => {
  try {
    const result = await CATEGORY_SERVICE.getCategoryById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin danh mục thành công'
    }))
  } catch (error) { next(error) }
}

const getAllCategories = async (req, res, next) => {
  try {
    const result = await CATEGORY_SERVICE.getAllCategories(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách danh mục thành công'
    }))
  } catch (error) { next(error) }
}
const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await CATEGORY_SERVICE.createCategory(req.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo danh mục thành công'
    }))
  } catch (error) { next(error) }
}

const updateCategory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await CATEGORY_SERVICE.updateCategoryById(req.params.id, req.body, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật danh mục thành công'
    }))
  } catch (error) { next(error) }
}

const deleteCategoryById = async (req, res, next) => {
  try {
    await CATEGORY_SERVICE.deleteCategoryById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      message: 'Xóa danh mục thành công'
    }))
  } catch (error) { next(error) }
}

const updateCategoryStatus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await CATEGORY_SERVICE.updateCategoryStatus(req.params.id, req.body.isActive, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật trạng thái danh mục thành công'
    }))
  } catch (error) { next(error) }
}
export const CATEGORY_CONTROLLER = {
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategoryById,
  updateCategoryStatus,
  getAllCategories
}