import { REVIEW_REPOSITORY } from '#repositories/reviewRepository.js'
import { ORDER_REPOSITORY } from '#repositories/orderRepository.js'
import { PRODUCT_REPOSITORY } from '#repositories/productRepository.js'
import { UPLOAD_SERVICE } from '#services/uploadService.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { uploadToCloudinary } from '#middlewares/uploadHandlingMiddleware.js'

const checkUserPurchasedProduct = async (userId, productId) => {
  const hasDeliveredOrder = await ORDER_REPOSITORY.hasDeliveredOrderWithProduct(userId, productId)
  return !!hasDeliveredOrder
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

const uploadReviewImages = async (files) => {
  if (!files || files.length === 0) return []
  if (files.length > 5) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ được upload tối đa 5 ảnh'])
  }
  const results = await Promise.all(files.map(file => uploadToCloudinary(file.buffer, 'reviews')))
  return results.map(r => r.public_id)
}

const mapReviewImages = (imagePublicIds = []) => {
  if (!Array.isArray(imagePublicIds) || imagePublicIds.length === 0) return []
  return imagePublicIds.map((publicId) => ({
    publicId,
    imageUrl: UPLOAD_SERVICE.buildImageUrl(publicId)
  }))
}

const mapProductImagesToUrls = (product = null) => {
  if (!product) return product

  const productObj = product.toObject ? product.toObject() : { ...product }
  if (!Array.isArray(productObj.images) || productObj.images.length === 0) {
    productObj.images = []
    return productObj
  }

  productObj.images = productObj.images
    .map((publicId) => UPLOAD_SERVICE.buildImageUrl(publicId))
    .filter(Boolean)

  return productObj
}

const mapReviewWithImages = (review) => {
  if (!review) return review
  const reviewObj = review.toObject ? review.toObject() : { ...review }
  reviewObj.images = mapReviewImages(reviewObj.images)
  reviewObj.product = mapProductImagesToUrls(reviewObj.product)
  return reviewObj
}

const mapReviewsWithImages = (reviews) => {
  return reviews.map(mapReviewWithImages)
}

const createReview = async (data, userId, files) => {
  const { productId, rating, comment = '' } = data

  // Validate product exists
  await assertProductExists(productId)

  // Check if user purchased the product
  await assertUserPurchasedProduct(userId, productId)

  // Check if user already reviewed this product
  const existingReview = await REVIEW_REPOSITORY.checkExistingReview(userId, productId)
  if (existingReview) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Bạn đã đánh giá sản phẩm này rồi'])
  }

  // Upload images to Cloudinary
  const imagePublicIds = await uploadReviewImages(files)

  // Create review
  const review = await REVIEW_REPOSITORY.createReview({
    product: productId,
    user: userId,
    rating,
    comment,
    images: imagePublicIds
  })

  await updateProductRating(productId)

  const created = await REVIEW_REPOSITORY.getReviewById(review._id)
  return mapReviewWithImages(created)
}

const getReviewById = async (reviewId) => {
  const review = await assertReviewExists(reviewId)
  return mapReviewWithImages(review)
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
    data: mapReviewsWithImages(result.docs),
    pagination: mapMongoosePagination(result)
  }
}

const getMyReviews = async (userId, query = {}) => {
  const { page, limit, rating, productId, sortBy, sortOrder } = query

  const filter = {}
  if (rating) {
    filter.rating = rating
  }
  if (productId) {
    filter.product = productId
  }

  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await REVIEW_REPOSITORY.getReviewsByUser(userId, filter, {
    page,
    limit,
    sort
  })

  return {
    data: mapReviewsWithImages(result.docs),
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
    data: mapReviewsWithImages(result.docs),
    pagination: mapMongoosePagination(result)
  }
}

const updateReviewById = async (reviewId, data, userId, files) => {
  const { rating, comment } = data

  const review = await assertReviewExists(reviewId)

  assertReviewOwnership(review, userId)

  const updateData = {}
  if (rating !== undefined) updateData.rating = rating
  if (comment !== undefined) updateData.comment = comment

  // Upload new images if provided
  if (files && files.length > 0) {
    updateData.images = await uploadReviewImages(files)
  }

  // Update review
  const updatedReview = await REVIEW_REPOSITORY.updateReviewById(reviewId, updateData)

  // Update product rating
  await updateProductRating(review.product._id)

  return mapReviewWithImages(updatedReview)
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
  const mappedExistingReview = existingReview ? mapReviewWithImages(existingReview) : null

  return {
    canReview: hasPurchased && !existingReview,
    hasPurchased,
    hasReviewed: !!existingReview,
    existingReview: mappedExistingReview
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
