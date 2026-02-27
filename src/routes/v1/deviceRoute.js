import express from 'express'
import {
  DEVICE_FIELD_CREATE,
  DEVICE_FIELD_UPDATE,
  DEVICE_FIELD_UPDATE_STATUS,
  REQUIRE_FIELD_CREATE_DEVICE
} from '#validations/deviceValidation.js'
import { DEVICE_VALIDATION } from '#validations/deviceValidation.js'
import { DEVICE_CONTROLLER } from '#controllers/deviceController.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management
 * /api/v1/devices:
 *   post:
 *     summary: Create a new device (admin only)
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceCreate'
 *     responses:
 *       '201':
 *         description: Device created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       '400':
 *         description: Validation error
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
 *     parameters:
  *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, thương hiệu hoặc mẫu mã
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *         description: Trường sắp xếp
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       '200':
 *         description: List of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Device'
 * /api/v1/devices/all:
 *   get:
 *     summary: Get all devices without pagination
 *     tags: [Devices]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, thương hiệu hoặc mẫu mã
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *         description: Trường sắp xếp
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       '200':
 *         description: All devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lấy tất cả thiết bị thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 * /api/v1/devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Device found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       '404':
 *         description: Device not found
 *   put:
 *     summary: Update device by ID (admin only)
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceUpdate'
 *     responses:
 *       '200':
 *         description: Device updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       '400':
 *         description: Validation error
 *   delete:
 *     summary: Delete device by ID (admin only)
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Device deleted
 *       '404':
 *         description: Device not found
 * /api/v1/devices/{id}/status:
 *   patch:
 *     summary: Update device status (admin only)
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Status updated
 *       '400':
 *         description: Validation error
 *
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdBy:
 *           type: string
 *         updatedBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     DeviceCreate:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - brand
 *         - model
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [smartphone, tablet, laptop]
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *     DeviceUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [smartphone, tablet, laptop]
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         isActive:
 *           type: boolean
 */

router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(DEVICE_FIELD_CREATE, REQUIRE_FIELD_CREATE_DEVICE),
  validationHandlingMiddleware({ body: DEVICE_VALIDATION.createDevice }),
  DEVICE_CONTROLLER.createDevice
)

router.get(
  '/',
  apiRateLimiter,
  validationHandlingMiddleware({ query: DEVICE_VALIDATION.query }),
  DEVICE_CONTROLLER.getAllDevices
)

router.get(
  '/all',
  apiRateLimiter,
  validationHandlingMiddleware({ query: DEVICE_VALIDATION.queryNoPagination }),
  DEVICE_CONTROLLER.getAllDevicesWithoutPagination
)

router.get(
  '/:id',
  apiRateLimiter,
  validationHandlingMiddleware({ params: DEVICE_VALIDATION.idParam }),
  DEVICE_CONTROLLER.getDeviceById
)

router.put(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(DEVICE_FIELD_UPDATE),
  validationHandlingMiddleware({
    params: DEVICE_VALIDATION.idParam,
    body: DEVICE_VALIDATION.updateDevice
  }),
  DEVICE_CONTROLLER.updateDevice
)

router.patch(
  '/:id/status',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(DEVICE_FIELD_UPDATE_STATUS),
  validationHandlingMiddleware({
    params: DEVICE_VALIDATION.idParam,
    body: DEVICE_VALIDATION.updateDeviceStatus
  }),
  DEVICE_CONTROLLER.updateDeviceStatus
)

router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: DEVICE_VALIDATION.idParam }),
  DEVICE_CONTROLLER.deleteDevice
)

export const DEVICE_ROUTE = router
