import { StatusCodes } from 'http-status-codes'
import { REVIEW_SERVICE } from '#services/reviewService.js'
import { responseSuccess } from '#utils/responseUtil.js'

const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await REVIEW_SERVICE.createReview(req.validated.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo đánh giá thành công'
    }))
  } catch (error) { next(error) }
}

const getReviewById = async (req, res, next) => {
  try {
    const result = await REVIEW_SERVICE.getReviewById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin đánh giá thành công'
    }))
  } catch (error) { next(error) }
}

const getReviewsByProduct = async (req, res, next) => {
  try {
    const result = await REVIEW_SERVICE.getReviewsByProduct(
      req.params.productId,
      req.validated.query
    )
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách đánh giá của sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await REVIEW_SERVICE.getMyReviews(userId, req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách đánh giá của tôi thành công'
    }))
  } catch (error) { next(error) }
}

const getAllReviews = async (req, res, next) => {
  try {
    const result = await REVIEW_SERVICE.getAllReviews(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách đánh giá thành công'
    }))
  } catch (error) { next(error) }
}

const updateReviewById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await REVIEW_SERVICE.updateReviewById(
      req.params.id,
      req.validated.body,
      userId
    )
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật đánh giá thành công'
    }))
  } catch (error) { next(error) }
}

const deleteReviewById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await REVIEW_SERVICE.deleteReviewById(req.params.id, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Xóa đánh giá thành công'
    }))
  } catch (error) { next(error) }
}

const getProductReviewStats = async (req, res, next) => {
  try {
    const result = await REVIEW_SERVICE.getProductReviewStats(req.params.productId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thống kê đánh giá của sản phẩm thành công'
    }))
  } catch (error) { next(error) }
}

const checkUserCanReview = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await REVIEW_SERVICE.checkUserCanReview(userId, req.params.productId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Kiểm tra quyền đánh giá thành công'
    }))
  } catch (error) { next(error) }
}

export const REVIEW_CONTROLLER = {
  createReview,
  getReviewById,
  getReviewsByProduct,
  getMyReviews,
  getAllReviews,
  updateReviewById,
  deleteReviewById,
  getProductReviewStats,
  checkUserCanReview
}
