import express from 'express'
import { ORDER_CONTROLLER } from '#controllers/orderController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { ORDER_VALIDATION } from '#validations/orderValidation.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { ORDER_CONSTANT } from '#constants/orderConstant.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'

const router = express.Router()

// Apply authentication to all routes
router.use(authorizationMiddleware)

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create new order from cart
 *     description: Customer creates order from their cart (COD payment only for now)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - fullname
 *                   - phone
 *                   - addressLine
 *                   - city
 *                   - district
 *                   - ward
 *                 properties:
 *                   fullname:
 *                     type: string
 *                     example: Nguyen Van A
 *                   phone:
 *                     type: string
 *                     example: '0912345678'
 *                   addressLine:
 *                     type: string
 *                     example: 123 Nguyen Trai
 *                   city:
 *                     type: string
 *                     example: Ho Chi Minh
 *                   district:
 *                     type: string
 *                     example: District 1
 *                   ward:
 *                     type: string
 *                     example: Ward 1
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod]
 *                 example: cod
 *               message:
 *                 type: string
 *                 example: Please deliver in the morning
 *               branchId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  sanitizeRequest(ORDER_CONSTANT.CREATE_ORDER_FIELDS, ORDER_CONSTANT.CREATE_ORDER_REQUIRED_FIELDS),
  validationHandlingMiddleware({ body: ORDER_VALIDATION.createOrder }),
  ORDER_CONTROLLER.createOrder
)

/**
 * @swagger
 * /api/v1/orders/offline:
 *   post:
 *     summary: Create offline order (Staff/Manager)
 *     description: Staff or Manager creates order for customer at branch (walk-in purchase)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - items
 *               - paymentMethod
 *               - branchId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [offline]
 *                 example: offline
 *               customerId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: Customer ID (optional, for registered customers)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                   properties:
 *                     product:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     services:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *               shippingAddress:
 *                 type: object
 *                 description: Required only if hasDelivery is true
 *                 properties:
 *                   fullname:
 *                     type: string
 *                     example: Nguyen Van A
 *                   phone:
 *                     type: string
 *                     example: '0912345678'
 *                   addressLine:
 *                     type: string
 *                     example: 123 Nguyen Trai
 *                   city:
 *                     type: string
 *                     example: Ho Chi Minh
 *                   district:
 *                     type: string
 *                     example: District 1
 *                   ward:
 *                     type: string
 *                     example: Ward 1
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, cod, bank_transfer, vnpay]
 *                 example: cash
 *               message:
 *                 type: string
 *                 example: Customer note
 *               branchId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               hasDelivery:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *     responses:
 *       201:
 *         description: Offline order created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only staff or manager can create offline orders
 */
router.post(
  '/offline',
  apiRateLimiter,
  requireRoles(RoleEnum.STAFF, RoleEnum.MANAGER, RoleEnum.ADMIN),
  sanitizeRequest(ORDER_CONSTANT.CREATE_OFFLINE_ORDER_FIELDS, ORDER_CONSTANT.CREATE_OFFLINE_ORDER_REQUIRED_FIELDS),
  validationHandlingMiddleware({ body: ORDER_VALIDATION.createOfflineOrder }),
  ORDER_CONTROLLER.createOfflineOrder
)

/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Get customer's orders (Customer)
 *     description: Get all orders of the authenticated customer
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, canceled]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, totalAmount, orderNumber]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-orders',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  validationHandlingMiddleware({ query: ORDER_VALIDATION.getOrders }),
  ORDER_CONTROLLER.getMyOrders
)

/**
 * @swagger
 * /api/v1/orders/statistics:
 *   get:
 *     summary: Get order statistics
 *     description: Get order count by status (customer sees their own, admin/staff sees all)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/statistics',
  apiRateLimiter,
  ORDER_CONTROLLER.getOrderStatistics
)

/**
 * @swagger
 * /api/v1/orders/all:
 *   get:
 *     summary: Get all orders (Admin/Staff/Manager)
 *     description: Get all orders in the system with filters
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, canceled]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, totalAmount, orderNumber]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/all',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.STAFF, RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: ORDER_VALIDATION.getOrders }),
  ORDER_CONTROLLER.getAllOrders
)

/**
 * @swagger
 * /api/v1/orders/order-number/{orderNumber}:
 *   get:
 *     summary: Get order by order number
 *     description: Get order details by order number
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: ORD-123456-ABC
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.get(
  '/order-number/:orderNumber',
  apiRateLimiter,
  validationHandlingMiddleware({ params: ORDER_VALIDATION.orderParam }),
  ORDER_CONTROLLER.getOrderByOrderNumber
)

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     description: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.get(
  '/:orderId',
  apiRateLimiter,
  validationHandlingMiddleware({ params: ORDER_VALIDATION.orderIdParam }),
  ORDER_CONTROLLER.getOrderById
)

/**
 * @swagger
 * /api/v1/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Admin/Staff/Manager)
 *     description: Update the status of an order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, canceled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
  '/:orderId/status',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.STAFF, RoleEnum.MANAGER),
  validationHandlingMiddleware({
    params: ORDER_VALIDATION.orderIdParam,
    body: ORDER_VALIDATION.updateOrderStatus
  }),
  ORDER_CONTROLLER.updateOrderStatus
)

/**
 * @swagger
 * /api/v1/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel order
 *     description: Cancel an order (customer can cancel their own orders, admin/staff/manager can cancel any)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancelReason
 *             properties:
 *               cancelReason:
 *                 type: string
 *                 example: Changed my mind about the purchase
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
  '/:orderId/cancel',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER, RoleEnum.ADMIN, RoleEnum.STAFF, RoleEnum.MANAGER),
  sanitizeRequest(ORDER_CONSTANT.CANCEL_ORDER_FIELDS),
  validationHandlingMiddleware({
    params: ORDER_VALIDATION.orderIdParam,
    body: ORDER_VALIDATION.cancelOrder
  }),
  ORDER_CONTROLLER.cancelOrder
)

/**
 * @swagger
 * /api/v1/orders/{orderId}/delivery:
 *   patch:
 *     summary: Update delivery information (Admin/Staff/Manager)
 *     description: Update delivery tracking and status information
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerName:
 *                 type: string
 *                 example: Giao Hang Nhanh
 *               trackingCode:
 *                 type: string
 *                 example: GHN123456789
 *               status:
 *                 type: string
 *                 enum: [pending, shipping, delivered, cancelled, failed]
 *                 example: shipping
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               deliveredAt:
 *                 type: string
 *                 format: date-time
 *               recipientName:
 *                 type: string
 *                 example: Nguyen Van A
 *     responses:
 *       200:
 *         description: Delivery info updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
  '/:orderId/delivery',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.STAFF, RoleEnum.MANAGER),
  sanitizeRequest(ORDER_CONSTANT.UPDATE_DELIVERY_INFO_FIELDS),
  validationHandlingMiddleware({
    params: ORDER_VALIDATION.orderIdParam,
    body: ORDER_VALIDATION.updateDeliveryInfo
  }),
  ORDER_CONTROLLER.updateDeliveryInfo
)

export const ORDER_ROUTE = router
