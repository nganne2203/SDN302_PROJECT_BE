import { reviewModel } from '#models/reviewModel.js'
import mongoose from 'mongoose'

const createReview = async (reviewData) => {
  return await reviewModel.create(reviewData)
}

const getReviewById = async (reviewId) => {
  return await reviewModel.findById(reviewId, { isDeleted: false })
    .populate('user', 'fullname email avatar')
    .populate('product', 'name slug images')
}

const getReviewsByProduct = async (productId, filter = {}, options = {}) => {
  const query = { product: productId, isDeleted: false, ...filter }
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options

  return await reviewModel.paginate(query, {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'fullname email avatar' },
      { path: 'product', select: 'name slug images' }
    ]
  })
}

const getReviewsByUser = async (userId, filter = {}, options = {}) => {
  const query = { user: userId, isDeleted: false, ...filter }
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options

  return await reviewModel.paginate(query, {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'fullname email avatar' },
      { path: 'product', select: 'name slug images' }
    ]
  })
}

const getAllReviews = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options

  return await reviewModel.paginate({ ...filter, isDeleted }, {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'fullname email avatar' },
      { path: 'product', select: 'name slug images' }
    ]
  })
}

const updateReviewById = async (reviewId, updateData) => {
  return await reviewModel.findByIdAndUpdate(
    reviewId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'fullname email avatar')
    .populate('product', 'name slug images')
}

const deleteReviewById = async (reviewId) => {
  return await reviewModel.findByIdAndUpdate(reviewId, { isDeleted: true }, { new: true, runValidators: true, timestamps: true })
}

const checkExistingReview = async (userId, productId) => {
  return await reviewModel.findOne({ user: userId, product: productId, isDeleted: false })
}

const getReviewStats = async (productId) => {
  const objectId = new mongoose.Types.ObjectId(productId)
  const stats = await reviewModel.aggregate([
    { $match: { product: objectId, isDeleted: false } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ])

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  stats[0].ratingDistribution.forEach((rating) => {
    distribution[rating] = (distribution[rating] || 0) + 1
  })

  return {
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    totalReviews: stats[0].totalReviews,
    ratingDistribution: distribution
  }
}

export const REVIEW_REPOSITORY = {
  createReview,
  getReviewById,
  getReviewsByProduct,
  getReviewsByUser,
  getAllReviews,
  updateReviewById,
  deleteReviewById,
  checkExistingReview,
  getReviewStats
}
