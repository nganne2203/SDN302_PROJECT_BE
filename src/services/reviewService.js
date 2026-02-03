import { REVIEW_REPOSITORY } from '#repositories/reviewRepository.js'
import { ORDER_REPOSITORY } from '#repositories/orderRepository.js'
import { PRODUCT_REPOSITORY } from '#repositories/productRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { ORDER_STATUS } from '#constants/orderConstant.js'

const checkUserPurchasedProduct = async (userId, productId) => {
  // Find orders where:
  // 1. User matches
  // 2. Order status is DELIVERED
  // 3. Order contains the product
  const orders = await ORDER_REPOSITORY.getOrdersByUser(userId, {
    orderStatus: ORDER_STATUS.DELIVERED,
    'items.product': productId
  })

  return orders.docs && orders.docs.length > 0
}

const assertUserPurchasedProduct = async (userId, productId) => {
  const hasPurchased = await checkUserPurchasedProduct(userId, productId)
  if (!hasPurchased) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn chưa mua sản phẩm này nên không thể đánh giá'])
  }
}

const assertProductExists = async (productId) => {
  const product = await PRODUCT_REPOSITORY.getProductById(productId)
  if (!product) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại'])
  }
  return product
}

const assertReviewExists = async (reviewId) => {
  const review = await REVIEW_REPOSITORY.getReviewById(reviewId)
  if (!review) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Đánh giá không tồn tại'])
  }
  return review
}

const assertReviewOwnership = (review, userId) => {
  if (review.user._id.toString() !== userId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Bạn không có quyền thao tác đánh giá này'])
  }
}

const updateProductRating = async (productId) => {
  const stats = await REVIEW_REPOSITORY.getReviewStats(productId)
  await PRODUCT_REPOSITORY.updateProductById(productId, {
    ratingAvg: stats.averageRating,
    ratingCount: stats.totalReviews
  })
}

const createReview = async (data, userId) => {
  const { productId, rating, comment = '', images = [] } = data

  // Validate product exists
  await assertProductExists(productId)

  // Check if user purchased the product
  await assertUserPurchasedProduct(userId, productId)

  // Check if user already reviewed this product
  const existingReview = await REVIEW_REPOSITORY.checkExistingReview(userId, productId)
  if (existingReview) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Bạn đã đánh giá sản phẩm này rồi'])
  }

  // Create review
  const review = await REVIEW_REPOSITORY.createReview({
    product: productId,
    user: userId,
    rating,
    comment,
    images
  })

  await updateProductRating(productId)

  return await REVIEW_REPOSITORY.getReviewById(review._id)
}

const getReviewById = async (reviewId) => {
  return await assertReviewExists(reviewId)
}

const getReviewsByProduct = async (productId, query = {}) => {
  const { page, limit, rating } = query

  // Validate product exists
  await assertProductExists(productId)

  const filter = {}
  if (rating) {
    filter.rating = rating
  }

  const result = await REVIEW_REPOSITORY.getReviewsByProduct(productId, filter, {
    page,
    limit,
    sort: { createdAt: -1 }
  })

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const getMyReviews = async (userId, query = {}) => {
  const { page, limit } = query

  const result = await REVIEW_REPOSITORY.getReviewsByUser(userId, {}, {
    page,
    limit,
    sort: { createdAt: -1 }
  })

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const getAllReviews = async (query = {}) => {
  const { page, limit, productId, rating, sortBy, sortOrder } = query

  const filter = {}
  if (productId) {
    filter.product = productId
  }
  if (rating) {
    filter.rating = rating
  }

  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await REVIEW_REPOSITORY.getAllReviews(filter, {
    page,
    limit,
    sort
  })

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const updateReviewById = async (reviewId, data, userId) => {
  const { rating, comment, images } = data

  const review = await assertReviewExists(reviewId)

  assertReviewOwnership(review, userId)

  const updateData = {}
  if (rating !== undefined) updateData.rating = rating
  if (comment !== undefined) updateData.comment = comment
  if (images !== undefined) updateData.images = images

  // Update review
  const updatedReview = await REVIEW_REPOSITORY.updateReviewById(reviewId, updateData)

  // Update product rating
  await updateProductRating(review.product._id)

  return updatedReview
}

const deleteReviewById = async (reviewId, userId) => {
  const review = await assertReviewExists(reviewId)

  // Check ownership
  assertReviewOwnership(review, userId)

  const productId = review.product._id

  // Delete review
  await REVIEW_REPOSITORY.deleteReviewById(reviewId)

  // Update product rating
  await updateProductRating(productId)

  return { message: 'Xóa đánh giá thành công' }
}

const getProductReviewStats = async (productId) => {
  // Validate product exists
  await assertProductExists(productId)

  return await REVIEW_REPOSITORY.getReviewStats(productId)
}

const checkUserCanReview = async (userId, productId) => {
  // Validate product exists
  await assertProductExists(productId)

  // Check if user purchased the product
  const hasPurchased = await checkUserPurchasedProduct(userId, productId)

  // Check if user already reviewed
  const existingReview = await REVIEW_REPOSITORY.checkExistingReview(userId, productId)

  return {
    canReview: hasPurchased && !existingReview,
    hasPurchased,
    hasReviewed: !!existingReview,
    existingReview: existingReview || null
  }
}

export const REVIEW_SERVICE = {
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
