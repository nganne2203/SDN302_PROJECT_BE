import express from 'express'
import { PAYMENT_CONTROLLER } from '#controllers/paymentController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { PAYMENT_VALIDATION } from '#validations/paymentValidation.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/payments/banks:
 *   get:
 *     summary: Get supported VNPay banks
 *     description: Get list of banks supported by VNPay for online payment
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Banks list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: NCB
 *                       name:
 *                         type: string
 *                         example: Ngân hàng NCB
 *                       logo:
 *                         type: string
 *                         example: https://sandbox.vnpayment.vn/paymentv2/images/bank/ncb.png
 */
router.get(
  '/banks',
  apiRateLimiter,
  PAYMENT_CONTROLLER.getSupportedBanks
)

/**
 * @swagger
 * /api/v1/payments/vnpay-return:
 *   get:
 *     summary: VNPay return URL handler
 *     description: Handle VNPay payment return. This endpoint is called by VNPay after payment completion.
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Transaction reference (order number)
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: VNPay response code
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Security hash
 *     responses:
 *       302:
 *         description: Redirect to frontend payment result page
 */
router.get(
  '/vnpay-return',
  PAYMENT_CONTROLLER.vnpayReturn
)

/**
 * @swagger
 * /api/v1/payments/vnpay-ipn:
 *   get:
 *     summary: VNPay IPN handler
 *     description: Handle VNPay Instant Payment Notification. This endpoint is called by VNPay server.
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: IPN processed
 */
router.get(
  '/vnpay-ipn',
  PAYMENT_CONTROLLER.vnpayIPN
)

// Apply authentication for following routes
router.use(authorizationMiddleware)

/**
 * @swagger
 * /api/v1/payments/vnpay/create:
 *   post:
 *     summary: Create VNPay payment for cart (customer, staff, admin, manager)
 *     description: Create a new VNPay payment for the cart items. Returns payment URL to redirect user .
 *     tags: [Payments]
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
 *               message:
 *                 type: string
 *                 example: Please deliver in the morning
 *               branchId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               bankCode:
 *                 type: string
 *                 example: NCB
 *                 description: Optional bank code for direct bank selection
 *               locale:
 *                 type: string
 *                 enum: [vn, en]
 *                 default: vn
 *                 description: Language for VNPay interface
 *     responses:
 *       200:
 *         description: VNPay payment created successfully
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
 *                     paymentUrl:
 *                       type: string
 *                       description: URL to redirect user for payment
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     transactionId:
 *                       type: string
 *                     amount:
 *                       type: number
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/vnpay/create',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER, RoleEnum.STAFF, RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ body: PAYMENT_VALIDATION.createVNPayPayment }),
  PAYMENT_CONTROLLER.createVNPayPayment
)

/**
 * @swagger
 * /api/v1/payments/my-payments:
 *   get:
 *     summary: Get user's payments (customer only)
 *     description: Get all payments of the authenticated user
 *     tags: [Payments]
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
 *           enum: [pending, success, failed, refunded, canceled]
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-payments',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER),
  validationHandlingMiddleware({ query: PAYMENT_VALIDATION.getMyPayments }),
  PAYMENT_CONTROLLER.getMyPayments
)

/**
 * @swagger
 * /api/v1/payments/status/{orderNumber}:
 *   get:
 *     summary: Query transaction status
 *     description: Query the payment transaction status from VNPay
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number
 *     responses:
 *       200:
 *         description: Transaction status retrieved
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/status/:orderNumber',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PAYMENT_VALIDATION.orderNumberParam }),
  PAYMENT_CONTROLLER.queryTransactionStatus
)

/**
 * @swagger
 * /api/v1/payments/check/{orderNumber}:
 *   get:
 *     summary: Check payment result
 *     description: Check if payment has been completed (for frontend polling)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number
 *     responses:
 *       200:
 *         description: Payment status
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/check/:orderNumber',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PAYMENT_VALIDATION.orderNumberParam }),
  PAYMENT_CONTROLLER.checkPaymentResult
)

/**
 * @swagger
 * /api/v1/payments/order/{orderId}:
 *   get:
 *     summary: Get payment by order ID (customer, staff, admin, manager)
 *     description: Get payment details for a specific order
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (24 character hex string)
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/order/:orderId',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER, RoleEnum.STAFF, RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ params: PAYMENT_VALIDATION.orderIdParam }),
  PAYMENT_CONTROLLER.getPaymentByOrderId
)

/**
 * @swagger
 * /api/v1/payments/{orderId}/cancel:
 *   post:
 *     summary: Cancel pending payment (customer, staff, admin, manager)
 *     description: Cancel a pending VNPay payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (24 character hex string)
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *       400:
 *         description: Payment cannot be cancelled
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:orderId/cancel',
  apiRateLimiter,
  requireRoles(RoleEnum.CUSTOMER, RoleEnum.STAFF, RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ params: PAYMENT_VALIDATION.orderIdParam }),
  PAYMENT_CONTROLLER.cancelPayment
)

export const PAYMENT_ROUTE = router
