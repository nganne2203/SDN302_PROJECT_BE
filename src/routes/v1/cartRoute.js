import express from 'express'
import { CART_CONTROLLER } from '#controllers/cartController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { CART_VALIDATION } from '#validations/cartValidation.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { CART_CONSTANT } from '#constants/cartConstant.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'

const router = express.Router()
router.use(authorizationMiddleware)
/**
 * @swagger
 * /api/v1/carts:
 *   get:
 *     summary: Get user's cart
 *     description: Get current user's shopping cart with all items
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  CART_CONTROLLER.getCart
)
/**
 * @swagger
 * /api/v1/carts:
 *   post:
 *     summary: Add product to cart
 *     description: Add a product with optional services to cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               quantity:
 *                 type: number
 *                 example: 2
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  sanitizeRequest(CART_CONSTANT.ADD_TO_CART_FIELDS, CART_CONSTANT.ADD_TO_CART_REQUIRED_FIELDS),
  validationHandlingMiddleware({ body: CART_VALIDATION.addToCart }),
  CART_CONTROLLER.addToCart
)

/**
 * @swagger
 * /api/v1/carts/clear:
 *   delete:
 *     summary: Clear entire cart
 *     description: Remove all items from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete(
  '/clear',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  CART_CONTROLLER.clearCart
)

/**
 * @swagger
 * /api/v1/carts/validate-before-checkout:
 *   post:
 *     summary: Validate cart before checkout
 *     description: Validate cart items availability and prices
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart is valid
 *       400:
 *         description: Cart validation failed
 */
router.post(
  '/validate-before-checkout',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  CART_CONTROLLER.validateCart
)

/**
 * @swagger
 * /api/v1/carts/item:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a product from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed successfully
 */
router.delete(
  '/item',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  sanitizeRequest(CART_CONSTANT.REMOVE_CART_ITEM_FIELDS, CART_CONSTANT.REMOVE_CART_ITEM_FIELDS),
  validationHandlingMiddleware({ body: CART_VALIDATION.removeCartItem }),
  CART_CONTROLLER.removeCartItem
)

/**
 * @swagger
 * /api/v1/carts/item/quantity:
 *   put:
 *     summary: Update cart item quantity
 *     description: Update quantity of a product in cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quantity updated successfully
 */
router.put(
  '/item/quantity',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  sanitizeRequest(CART_CONSTANT.UPDATE_CART_ITEM_FIELDS, CART_CONSTANT.UPDATE_CART_ITEM_FIELDS),
  validationHandlingMiddleware({ body: CART_VALIDATION.updateCartItem }),
  CART_CONTROLLER.updateCartItemQuantity
)

/**
 * @swagger
 * /api/v1/carts/item/services:
 *   put:
 *     summary: Update cart item services
 *     description: Update services for a product in cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - services
 *             properties:
 *               productId:
 *                 type: string
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Services updated successfully
 */
router.put(
  '/item/services',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  sanitizeRequest(CART_CONSTANT.UPDATE_CART_SERVICES_FIELDS, CART_CONSTANT.UPDATE_CART_SERVICES_FIELDS),
  validationHandlingMiddleware({ body: CART_VALIDATION.updateCartItemServices }),
  CART_CONTROLLER.updateCartItemServices
)

export const CART_ROUTE = router