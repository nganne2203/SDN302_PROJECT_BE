import express from 'express'
import { PRICING_CONTROLLER } from '#controllers/pricingController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { PRICING_VALIDATION } from '#validations/pricingValidation.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Pricing management APIs
 */

/**
 * @swagger
 * /api/v1/pricings:
 *   get:
 *     summary: Get all pricing rules
 *     description: Retrieve all pricing rules with pagination. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Pricing rules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pricing'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get(
  '/',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.getAllPricings),
  PRICING_CONTROLLER.getAllPricings
)

/**
 * @swagger
 * /api/v1/pricings/product/{productId}:
 *   get:
 *     summary: Get pricing rules by product
 *     description: Get all pricing tiers for a specific product. Public access.
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Pricing rules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                     pricingTiers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Pricing'
 *       404:
 *         description: Product not found
 */
router.get(
  '/product/:productId',
  validationHandlingMiddleware(PRICING_VALIDATION.getPricingsByProduct),
  PRICING_CONTROLLER.getPricingsByProduct
)

/**
 * @swagger
 * /api/v1/pricings/calculate/{productId}:
 *   get:
 *     summary: Calculate price for a product
 *     description: Calculate the final price for a product based on quantity and applicable pricing rules. Public access.
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Quantity to calculate price for
 *     responses:
 *       200:
 *         description: Price calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                     quantity:
 *                       type: integer
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         pricePerUnit:
 *                           type: number
 *                         totalPrice:
 *                           type: number
 *                         originalTotal:
 *                           type: number
 *                         savings:
 *                           type: number
 *                         discountPercentage:
 *                           type: number
 *       404:
 *         description: Product not found
 */
router.get(
  '/calculate/:productId',
  validationHandlingMiddleware(PRICING_VALIDATION.calculatePrice),
  PRICING_CONTROLLER.calculatePrice
)

/**
 * @swagger
 * /api/v1/pricings/{id}:
 *   get:
 *     summary: Get pricing by ID
 *     description: Get a specific pricing rule by ID. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing ID
 *     responses:
 *       200:
 *         description: Pricing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Pricing'
 *       404:
 *         description: Pricing not found
 */
router.get(
  '/:id',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.getPricingById),
  PRICING_CONTROLLER.getPricingById
)

/**
 * @swagger
 * /api/v1/pricings:
 *   post:
 *     summary: Create a pricing rule
 *     description: Create a new pricing rule for a product. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - minQuantity
 *               - pricePerUnit
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID
 *               minQuantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Minimum quantity for this pricing tier
 *               maxQuantity:
 *                 type: integer
 *                 nullable: true
 *                 description: Maximum quantity (null for unlimited)
 *               pricePerUnit:
 *                 type: number
 *                 minimum: 0
 *                 description: Price per unit for this tier
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage (optional)
 *               description:
 *                 type: string
 *                 description: Description of this pricing tier
 *     responses:
 *       201:
 *         description: Pricing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Pricing'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Overlapping pricing rule exists
 */
router.post(
  '/',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.createPricing),
  PRICING_CONTROLLER.createPricing
)

/**
 * @swagger
 * /api/v1/pricings/bulk:
 *   post:
 *     summary: Create bulk pricing tiers
 *     description: Create multiple pricing tiers for a product at once. This will replace all existing pricing rules for the product. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - tiers
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID
 *               tiers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - minQuantity
 *                     - pricePerUnit
 *                   properties:
 *                     minQuantity:
 *                       type: integer
 *                       minimum: 1
 *                     maxQuantity:
 *                       type: integer
 *                       nullable: true
 *                     pricePerUnit:
 *                       type: number
 *                       minimum: 0
 *                     discountPercentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                     description:
 *                       type: string
 *           example:
 *             productId: "64f8e1234567890abcdef123"
 *             tiers:
 *               - minQuantity: 1
 *                 maxQuantity: 4
 *                 pricePerUnit: 100000
 *                 description: "Giá lẻ"
 *               - minQuantity: 5
 *                 maxQuantity: 9
 *                 pricePerUnit: 95000
 *                 discountPercentage: 5
 *                 description: "Mua từ 5 sản phẩm"
 *               - minQuantity: 10
 *                 maxQuantity: null
 *                 pricePerUnit: 90000
 *                 discountPercentage: 10
 *                 description: "Mua sỉ từ 10 sản phẩm"
 *     responses:
 *       201:
 *         description: Pricing tiers created successfully
 *       400:
 *         description: Invalid input or overlapping tiers
 */
router.post(
  '/bulk',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.createBulkPricings),
  PRICING_CONTROLLER.createBulkPricings
)

/**
 * @swagger
 * /api/v1/pricings/{id}:
 *   put:
 *     summary: Update a pricing rule
 *     description: Update an existing pricing rule. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minQuantity:
 *                 type: integer
 *                 minimum: 1
 *               maxQuantity:
 *                 type: integer
 *                 nullable: true
 *               pricePerUnit:
 *                 type: number
 *                 minimum: 0
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing updated successfully
 *       404:
 *         description: Pricing not found
 *       409:
 *         description: Overlapping pricing rule exists
 */
router.put(
  '/:id',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.updatePricing),
  PRICING_CONTROLLER.updatePricing
)

/**
 * @swagger
 * /api/v1/pricings/{id}/toggle:
 *   patch:
 *     summary: Toggle pricing active status
 *     description: Toggle the active status of a pricing rule. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing ID
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       404:
 *         description: Pricing not found
 */
router.patch(
  '/:id/toggle',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.togglePricingStatus),
  PRICING_CONTROLLER.togglePricingStatus
)

/**
 * @swagger
 * /api/v1/pricings/{id}:
 *   delete:
 *     summary: Delete a pricing rule
 *     description: Delete a specific pricing rule. Accessible by Admin and Manager.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing ID
 *     responses:
 *       200:
 *         description: Pricing deleted successfully
 *       404:
 *         description: Pricing not found
 */
router.delete(
  '/:id',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware(PRICING_VALIDATION.deletePricing),
  PRICING_CONTROLLER.deletePricing
)

/**
 * @swagger
 * /api/v1/pricings/product/{productId}:
 *   delete:
 *     summary: Delete all pricing rules for a product
 *     description: Delete all pricing rules associated with a product. Accessible by Admin only.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: All pricing rules deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete(
  '/product/:productId',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware(PRICING_VALIDATION.deleteProductPricings),
  PRICING_CONTROLLER.deleteProductPricings
)

/**
 * @swagger
 * components:
 *   schemas:
 *     Pricing:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         product:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             sku:
 *               type: string
 *             basePrice:
 *               type: number
 *         minQuantity:
 *           type: integer
 *           description: Minimum quantity for this pricing tier
 *         maxQuantity:
 *           type: integer
 *           nullable: true
 *           description: Maximum quantity (null for unlimited)
 *         pricePerUnit:
 *           type: number
 *           description: Price per unit for this tier
 *         discountPercentage:
 *           type: number
 *           description: Discount percentage
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdBy:
 *           type: object
 *         updatedBy:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export const pricingRoute = router
