import { StatusCodes } from 'http-status-codes'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { responseSuccess } from '#utils/responseUtil.js'

const getProductById = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const getAllProducts = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getAllProducts(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const searchProducts = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.searchProducts(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Tìm kiếm sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const getProductCategories = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductCategories()
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy danh sách danh mục sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const createProduct = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await PRODUCT_SERVICE.createProduct(req.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const updateProduct = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await PRODUCT_SERVICE.updateProductById(req.params.id, req.body, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const deleteProductById = async (req, res, next) => {
  try {
    await PRODUCT_SERVICE.deleteProductById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      message: 'Xóa sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const updateProductStatus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await PRODUCT_SERVICE.updateProductStatus(req.params.id, req.body.isActive, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật trạng thái sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

export const PRODUCT_CONTROLLER = {
  getProductById,
  getAllProducts,
  searchProducts,
  getProductCategories,
  createProduct,
  updateProduct,
  deleteProductById,
  updateProductStatus
}
