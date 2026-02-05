import { StatusCodes } from 'http-status-codes'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { responseSuccess } from '#utils/responseUtil.js'

const getProductById = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductByIdWithImages(req.params.id)
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

const getProductBySlug = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductBySlug(req.params.slug)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const getProductsWithStock = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductsWithStock(req.validated?.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách sản phẩm với thông tin tồn kho thành công'
    }))
  } catch (error) { next(error) }
}

const getProductsByDevice = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductsByDevice(req.params.deviceId, req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy sản phẩm theo thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const getFeaturedProducts = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getFeaturedProducts(req.validated?.query ?? req.query ?? {})
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy sản phẩm nổi bật thành công'
    }))
  } catch (error) { next(error) }
}

const getNewArrivals = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getNewArrivals(req.validated?.query ?? req.query ?? {})
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy sản phẩm mới thành công'
    }))
  } catch (error) { next(error) }
}

const getRelatedProducts = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getRelatedProducts(req.params.id, req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy sản phẩm liên quan thành công'
    }))
  } catch (error) { next(error) }
}

const getProductDetailForOrder = async (req, res, next) => {
  try {
    const result = await PRODUCT_SERVICE.getProductDetailForOrder(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin sản phẩm để đặt hàng thành công'
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
  updateProductStatus,
  getProductBySlug,
  getProductsWithStock,
  getProductsByDevice,
  getFeaturedProducts,
  getNewArrivals,
  getRelatedProducts,
  getProductDetailForOrder
}
