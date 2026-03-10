import express from 'express'
import { REVIEW_CONTROLLER } from '#controllers/reviewController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { REVIEW_VALIDATION } from '#validations/reviewValidation.js'
import { REVIEW_CONSTANT } from '#constants/reviewConstant.js'
import upload from '#middlewares/uploadHandlingMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a review for a product
 *     description: Create a review for a product. User must have purchased and received the product.
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to review
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 description: Review comment
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Review images (max 5 files)
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input or already reviewed
 *       403:
 *         description: User has not purchased the product
 *       404:
 *         description: Product not found
 */
router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  upload.array('images', 5),
  sanitizeRequest(REVIEW_CONSTANT.CREATE_REVIEW_FIELDS, REVIEW_CONSTANT.CREATE_REVIEW_REQUIRED_FIELDS),
  validationHandlingMiddleware({ body: REVIEW_VALIDATION.createReview }),
  REVIEW_CONTROLLER.createReview
)

/**
 * @swagger
 * /api/v1/reviews/my-reviews:
 *   get:
 *     summary: Get my reviews
 *     description: Get all reviews created by the authenticated user
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get(
  '/my-reviews',
  apiRateLimiter,
  authorizationMiddleware,
  validationHandlingMiddleware({ query: REVIEW_VALIDATION.getReviews }),
  REVIEW_CONTROLLER.getMyReviews
)

/**
 * @swagger
 * /api/v1/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews by product
 *     description: Get all reviews for a specific product
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of reviews per page
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
  '/product/:productId',
  apiRateLimiter,
  validationHandlingMiddleware({
    params: REVIEW_VALIDATION.productIdParam,
    query: REVIEW_VALIDATION.getReviews
  }),
  REVIEW_CONTROLLER.getReviewsByProduct
)

/**
 * @swagger
 * /api/v1/reviews/product/{productId}/stats:
 *   get:
 *     summary: Get product review statistics
 *     description: Get review statistics for a specific product including average rating and rating distribution
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
  '/product/:productId/stats',
  apiRateLimiter,
  validationHandlingMiddleware({ params: REVIEW_VALIDATION.productIdParam }),
  REVIEW_CONTROLLER.getProductReviewStats
)

/**
 * @swagger
 * /api/v1/reviews/product/{productId}/can-review:
 *   get:
 *     summary: Check if user can review a product
 *     description: Check if the authenticated user can review a product (has purchased and not reviewed yet)
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Check result returned successfully
 *       404:
 *         description: Product not found
 */
router.get(
  '/product/:productId/can-review',
  apiRateLimiter,
  authorizationMiddleware,
  validationHandlingMiddleware({ params: REVIEW_VALIDATION.productIdParam }),
  REVIEW_CONTROLLER.checkUserCanReview
)

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get all reviews (Admin, Staff, Manager only)
 *     description: Get all reviews with filtering and pagination
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of reviews per page
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.STAFF, RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: REVIEW_VALIDATION.getReviews }),
  REVIEW_CONTROLLER.getAllReviews
)

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by ID (public)
 *     description: Get a specific review by its ID
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 */
router.get(
  '/:id',
  apiRateLimiter,
  validationHandlingMiddleware({ params: REVIEW_VALIDATION.idParam }),
  REVIEW_CONTROLLER.getReviewById
)

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   patch:
 *     summary: Update a review (authenticated user)
 *     description: Update a review. Only the review owner can update.
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 description: Review comment
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Review images (max 5 files)
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not authorized to update this review
 *       404:
 *         description: Review not found
 */
router.patch(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  upload.array('images', 5),
  sanitizeRequest(REVIEW_CONSTANT.UPDATE_REVIEW_FIELDS),
  validationHandlingMiddleware({
    params: REVIEW_VALIDATION.idParam,
    body: REVIEW_VALIDATION.updateReview
  }),
  REVIEW_CONTROLLER.updateReviewById
)

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review (authenticated user)
 *     description: Delete a review. Only the review owner can delete.
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized to delete this review
 *       404:
 *         description: Review not found
 */
router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  validationHandlingMiddleware({ params: REVIEW_VALIDATION.idParam }),
  REVIEW_CONTROLLER.deleteReviewById
)

export const REVIEW_ROUTE = router
