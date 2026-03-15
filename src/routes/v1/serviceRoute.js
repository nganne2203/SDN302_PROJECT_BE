import express from 'express'
import { RoleEnum } from '#constants/roleConstant.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { SERVICE_VALIDATION } from '#validations/serviceValidation.js'
import { CREATE_SERVICE_FIELDS, CREATE_SERVICE_REQUIRED, UPDATE_SERVICE_FIELDS, UPDATE_SERVICE_STATUS } from '#constants/serviceConstant.js'
import { SERVICE_CONTROLLER } from '#controllers/serviceController.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/services:
 *   post:
 *     summary: Create a new service (admin only)
 *     description: Create a new service for a specific product. Only admins can create services.
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - name
 *               - type
 *               - price
 *             properties:
 *               product:
 *                 type: string
 *                 description: The ID of the product
 *                 example: 60f1b9b9b9b9b9b9b9b9b9b9
 *               name:
 *                 type: string
 *                 description: The name of the service
 *                 example: Khắc tên
 *               description:
 *                 type: string
 *                 description: The description of the service
 *                 example: Dịch vụ khắc tên lên sản phẩm
 *               type:
 *                 type: string
 *                 description: The type of the service
 *                 enum: [engraving, printing, drilling, cutting, embossing, coating, lamination, other]
 *                 example: engraving
 *               price:
 *                 type: number
 *                 description: The price of the service
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Bad request (Validation error or duplicate service name)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 */
router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(CREATE_SERVICE_FIELDS, CREATE_SERVICE_REQUIRED),
  validationHandlingMiddleware({ body: SERVICE_VALIDATION.createService }),
  SERVICE_CONTROLLER.createService
)

/**
 * @swagger
 * /api/v1/services:
 *   get:
 *     summary: Get all services (admin only)
 *     description: Retrieve a list of services with pagination, filtering, and sorting. Only admins can view this list.
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: The number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by service name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalResults:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách dịch vụ thành công
 *             example:
 *               data:
 *                 - _id: 60f1b9b9b9b9b9b9b9b9b9b9
 *                   product: 60f1b9b9b9b9b9b9b9b9b9b0
 *                   name: Khắc tên
 *                   description: Dịch vụ khắc tên lên sản phẩm
 *                   type: engraving
 *                   price: 50000
 *                   isActive: true
 *                   createdAt: 2023-01-01T00:00:00.000Z
 *                   updatedAt: 2023-01-01T00:00:00.000Z
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 totalResults: 1
 *               message: Lấy danh sách dịch vụ thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 */
router.get(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ query: SERVICE_VALIDATION.query }),
  SERVICE_CONTROLLER.getAllServices
)

router.get(
  '/all',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ query: SERVICE_VALIDATION.queryNoPagination }),
  SERVICE_CONTROLLER.getAllServicesWithoutPagination
)

/**
 * @swagger
 * /api/v1/services/{id}:
 *   get:
 *     summary: Get a service by ID
 *     description: Retrieve a service by its ID. Only admins can view this service.
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60f1b9b9b9b9b9b9b9b9b9b9
 *                     product:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60f1b9b9b9b9b9b9b9b9b9b0
 *                         name:
 *                           type: string
 *                           example: iPhone 15 Pro Max
 *                         image:
 *                           type: string
 *                           example: https://example.com/iphone15promax.jpg
 *                         price:
 *                           type: number
 *                           example: 29990000
 *                     name:
 *                       type: string
 *                       example: Khắc tên
 *                     description:
 *                       type: string
 *                       example: Dịch vụ khắc tên lên sản phẩm
 *                     type:
 *                       type: string
 *                       example: engraving
 *                     price:
 *                       type: number
 *                       example: 50000
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin dịch vụ thành công
 *             example:
 *               data:
 *                 _id: 60f1b9b9b9b9b9b9b9b9b9b9
 *                 product:
 *                   _id: 60f1b9b9b9b9b9b9b9b9b9b0
 *                   name: iPhone 15 Pro Max
 *                   image: https://example.com/iphone15promax.jpg
 *                   price: 29990000
 *                 name: Khắc tên
 *                 description: Dịch vụ khắc tên lên sản phẩm
 *                 type: engraving
 *                 price: 50000
 *                 isActive: true
 *                 createdAt: 2023-01-01T00:00:00.000Z
 *                 updatedAt: 2023-01-01T00:00:00.000Z
 *               message: Lấy thông tin dịch vụ thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 *       404:
 *         description: Service not found
 */
router.get(
  '/:id',
  apiRateLimiter,
  validationHandlingMiddleware({ params: SERVICE_VALIDATION.idParam }),
  SERVICE_CONTROLLER.getServiceById
)

/**
 * @swagger
 * /api/v1/services/{id}:
 *   put:
 *     summary: Update a service (admin only)
 *     description: Update service details. Only admins can update services.
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the service (must be unique within the product)
 *                 example: Khắc tên Update
 *               description:
 *                 type: string
 *                 description: The description of the service
 *                 example: Dịch vụ khắc tên lên sản phẩm cập nhật
 *               type:
 *                 type: string
 *                 description: The type of the service
 *                 enum: [engraving, printing, drilling, cutting, embossing, coating, lamination, other]
 *                 example: engraving
 *               price:
 *                 type: number
 *                 description: The price of the service
 *                 example: 55000
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật dịch vụ thành công
 *       400:
 *         description: Bad request (Validation error or duplicate service name)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 *       404:
 *         description: Service not found
 */
router.put(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_SERVICE_FIELDS, []),
  validationHandlingMiddleware({
    params: SERVICE_VALIDATION.idParam,
    body: SERVICE_VALIDATION.updateService
  }),
  SERVICE_CONTROLLER.updateService
)

/**
 * @swagger
 * /api/v1/services/{id}/status:
 *   patch:
 *     summary: Update a service status (admin only)
 *     description: Update service status. Only admins can update service status.
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: The status of the service
 *                 example: false
 *     responses:
 *       200:
 *         description: Service status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật trạng thái dịch vụ thành công
 *       400:
 *         description: Bad request (Validation error or status not changed)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 *       404:
 *         description: Service not found
 */
router.patch(
  '/:id/status',
  apiRateLimiter,
  authorizationMiddleware,
  sanitizeRequest(UPDATE_SERVICE_STATUS, ['isActive']),
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({
    params: SERVICE_VALIDATION.idParam,
    body: SERVICE_VALIDATION.updateServiceStatus
  }),
  SERVICE_CONTROLLER.updateServiceStatus
)

/**
 * @swagger
 * /api/v1/services/{id}:
 *   delete:
 *     summary: Delete a service (admin only)
 *     description: Delete a service by ID. Only admins can delete services.
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Xóa dịch vụ thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 *       404:
 *         description: Service not found
 */
router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: SERVICE_VALIDATION.idParam }),
  SERVICE_CONTROLLER.deleteServiceById
)

/**
 * @swagger
 * /api/v1/services/product/{productId}:
 *   get:
 *     summary: Get services by product ID
 *     description: Retrieve all services for a specific product. Only admins can view this service.
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60f1b9b9b9b9b9b9b9b9b9b9
 *                       product:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60f1b9b9b9b9b9b9b9b9b9b0
 *                           name:
 *                             type: string
 *                             example: iPhone 15 Pro Max
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["https://example.com/iphone15promax.jpg"]
 *                           price:
 *                             type: number
 *                             example: 29990000
 *                       name:
 *                         type: string
 *                         example: Khắc tên
 *                       description:
 *                         type: string
 *                         example: Dịch vụ khắc tên lên sản phẩm
 *                       type:
 *                         type: string
 *                         example: engraving
 *                       price:
 *                         type: number
 *                         example: 50000
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-01-01T00:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-01-01T00:00:00.000Z
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách dịch vụ theo sản phẩm thành công
 *             example:
 *               data:
 *                 - _id: 60f1b9b9b9b9b9b9b9b9b9b9
 *                   product:
 *                     _id: 60f1b9b9b9b9b9b9b9b9b9b0
 *                     name: iPhone 15 Pro Max
 *                     images: ["https://example.com/iphone15promax.jpg"]
 *                     price: 29990000
 *                   name: Khắc tên
 *                   description: Dịch vụ khắc tên lên sản phẩm
 *                   type: engraving
 *                   price: 50000
 *                   isActive: true
 *                   createdAt: 2023-01-01T00:00:00.000Z
 *                   updatedAt: 2023-01-01T00:00:00.000Z
 *               message: Lấy danh sách dịch vụ theo sản phẩm thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 *       404:
 *         description: Product not found
 */
router.get('/product/:productId',
  apiRateLimiter,
  validationHandlingMiddleware({ params: SERVICE_VALIDATION.productIdParam }),
  SERVICE_CONTROLLER.getServiceByProductId
)

export const SERVICE_ROUTE = router