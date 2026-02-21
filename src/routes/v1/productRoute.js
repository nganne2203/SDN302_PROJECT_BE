import express from 'express'
import { PRODUCT_CONTROLLER } from '#controllers/productController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { PRODUCT_VALIDATION } from '#validations/productValidation.js'
import {
  CREATE_PRODUCT_FIELDS,
  CREATE_PRODUCT_REQUIRED,
  UPDATE_PRODUCT_FIELDS,
  UPDATE_PRODUCT_STATUS_FIELDS
} from '#constants/productConstant.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products with filtering and pagination (public)
 *     description: Retrieve a list of products with optional filtering, pagination, and sorting.
 *     tags: [Product]
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
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter products by name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter products by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter products by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt, ratingAvg, ratingCount]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order, either 'asc' or 'desc'
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 docs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalDocs:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  '/',
  apiRateLimiter,
  validationHandlingMiddleware({ query: PRODUCT_VALIDATION.query }),
  PRODUCT_CONTROLLER.getAllProducts
)

router.get(
  '/all',
  apiRateLimiter,
  validationHandlingMiddleware({ query: PRODUCT_VALIDATION.queryNoPagination }),
  PRODUCT_CONTROLLER.getAllProductsWithoutPagination
)

/**
 * @swagger
 * /api/v1/products/with-stock:
 *   get:
 *     summary: Get products with stock information (for ordering) (public)
 *     description: Retrieve products with stock availability and pricing rules for ordering.
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Products with stock info retrieved successfully
 */
router.get(
  '/with-stock',
  apiRateLimiter,
  validationHandlingMiddleware({ query: PRODUCT_VALIDATION.query }),
  PRODUCT_CONTROLLER.getProductsWithStock
)

/**
 * @swagger
 * /api/v1/products/featured:
 *   get:
 *     summary: Get featured products (public)
 *     description: Retrieve top-rated and popular products.
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 */
router.get(
  '/featured',
  apiRateLimiter,
  PRODUCT_CONTROLLER.getFeaturedProducts
)

/**
 * @swagger
 * /api/v1/products/new-arrivals:
 *   get:
 *     summary: Get new arrival products (public)
 *     description: Retrieve latest products.
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: New arrivals retrieved successfully
 */
router.get(
  '/new-arrivals',
  apiRateLimiter,
  PRODUCT_CONTROLLER.getNewArrivals
)

/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     summary: Search products (public)
 *     description: Search products by keyword with pagination and sorting.
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt, ratingAvg, ratingCount]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order, either 'asc' or 'desc'
 *     responses:
 *       200:
 *         description: Successfully retrieved search results
 *       400:
 *         description: Invalid query parameters or missing search keyword
 */
router.get(
  '/search',
  apiRateLimiter,
  validationHandlingMiddleware({ query: PRODUCT_VALIDATION.searchQuery }),
  PRODUCT_CONTROLLER.searchProducts
)

/**
 * @swagger
 * /api/v1/products/by-device/{deviceId}:
 *   get:
 *     summary: Get products by device compatibility (public)
 *     description: Retrieve products compatible with a specific device.
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID (24 character hex string)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       404:
 *         description: Device not found
 */
router.get(
  '/by-device/:deviceId',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.deviceIdParam }),
  PRODUCT_CONTROLLER.getProductsByDevice
)

/**
 * @swagger
 * /api/v1/products/slug/{slug}:
 *   get:
 *     summary: Get product by slug (public)
 *     description: Retrieve a product using SEO-friendly slug.
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
  '/slug/:slug',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.slugParam }),
  PRODUCT_CONTROLLER.getProductBySlug
)

/**
 * @swagger
 * /api/v1/products/categories:
 *   get:
 *     summary: Get product categories (public)
 *     description: Retrieve all available product categories.
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Successfully retrieved categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get(
  '/categories',
  apiRateLimiter,
  PRODUCT_CONTROLLER.getProductCategories
)

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID (public)
 *     description: Retrieve a specific product by its ID.
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (24 character hex string)
 *     responses:
 *       200:
 *         description: Successfully retrieved product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 description:
 *                   type: string
 *                 category:
 *                   type: object
 *                 price:
 *                   type: number
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of Cloudinary publicIds
 *                 material:
 *                   type: string
 *                 compatibility:
 *                   type: array
 *                   items:
 *                     type: string
 *                 ratingAvg:
 *                   type: number
 *                 ratingCount:
 *                   type: number
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 */
router.get(
  '/:id',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.idParam }),
  PRODUCT_CONTROLLER.getProductById
)

/**
 * @swagger
 * /api/v1/products/{id}/for-order:
 *   get:
 *     summary: Get product detail for ordering (public)
 *     description: Retrieve product with full stock info and pricing rules for order flow.
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (24 character hex string)
 *     responses:
 *       200:
 *         description: Product order info retrieved successfully
 *       400:
 *         description: Product not available
 *       404:
 *         description: Product not found
 */
router.get(
  '/:id/for-order',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.idParam }),
  PRODUCT_CONTROLLER.getProductDetailForOrder
)

/**
 * @swagger
 * /api/v1/products/{id}/related:
 *   get:
 *     summary: Get related products (public)
 *     description: Retrieve products in the same category.
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (24 character hex string)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
  '/:id/related',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.idParam }),
  PRODUCT_CONTROLLER.getRelatedProducts
)

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product (admin)
 *     description: |
 *       Create a new product (Admin only).
 *
 *       **Image Upload Flow:**
 *       1. First, upload images using POST /api/v1/uploads/multiple-images
 *       2. Get publicIds from the upload response
 *       3. Use those publicIds in the images array when creating product
 *     tags: [Product]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: iPhone 15 Pro Max Case
 *               description:
 *                 type: string
 *                 example: Premium protective case for iPhone 15 Pro Max
 *               categoryId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *                 description: Category ID (24 character hex string)
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 299000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['uploads/abc123def456', 'uploads/xyz789ghi012']
 *                 description: Array of Cloudinary publicIds (get from upload API first)
 *               material:
 *                 type: string
 *                 example: Silicone
 *               compatibility:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['60d0fe4f5311236168a109cb', '60d0fe4f5311236168a109cc']
 *                 description: Array of device IDs (24 character hex strings)
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(CREATE_PRODUCT_FIELDS, CREATE_PRODUCT_REQUIRED),
  validationHandlingMiddleware({ body: PRODUCT_VALIDATION.createProduct }),
  PRODUCT_CONTROLLER.createProduct
)

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update a product (admin)
 *     description: |
 *       Update an existing product by ID (Admin only).
 *
 *       **Image Update Flow:**
 *       - To add new images: Upload via POST /api/v1/uploads/multiple-images first, then include all publicIds (old + new)
 *       - To remove images: Simply exclude their publicIds from the images array (they will be auto-deleted from Cloudinary)
 *       - To keep existing images: Include their publicIds in the array
 *     tags: [Product]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (24 character hex string)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: iPhone 15 Pro Max Case - Updated
 *               description:
 *                 type: string
 *                 example: Updated description
 *               categoryId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *                 description: Category ID (24 character hex string)
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 350000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['uploads/abc123def456']
 *                 description: Array of Cloudinary publicIds (old images not in array will be deleted from Cloudinary)
 *               material:
 *                 type: string
 *                 example: Premium Silicone
 *               compatibility:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['60d0fe4f5311236168a109cb']
 *                 description: Array of device IDs (24 character hex strings)
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid request body or product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Product not found
 */
router.put(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_PRODUCT_FIELDS, []),
  validationHandlingMiddleware({
    params: PRODUCT_VALIDATION.idParam,
    body: PRODUCT_VALIDATION.updateProduct
  }),
  PRODUCT_CONTROLLER.updateProduct
)

/**
 * @swagger
 * /api/v1/products/{id}/status:
 *   patch:
 *     summary: Update product status (admin only)
 *     description: Update the active status of a product (Admin only).
 *     tags: [Product]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (24 character hex string)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Product status updated successfully
 *       400:
 *         description: Invalid request body or product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Product not found
 */
router.patch(
  '/:id/status',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_PRODUCT_STATUS_FIELDS, UPDATE_PRODUCT_STATUS_FIELDS),
  validationHandlingMiddleware({
    params: PRODUCT_VALIDATION.idParam,
    body: PRODUCT_VALIDATION.updateProductStatus
  }),
  PRODUCT_CONTROLLER.updateProductStatus
)

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete a product (admin only)
 *     description: |
 *       Delete a product by ID (Admin only).
 *
 *       **Note:** All associated images will be automatically deleted from Cloudinary.
 *     tags: [Product]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (24 character hex string)
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Product not found
 */
router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.idParam }),
  PRODUCT_CONTROLLER.deleteProductById
)

export const PRODUCT_ROUTE = router
