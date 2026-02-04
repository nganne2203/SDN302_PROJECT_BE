import express from 'express'
import { BRANCH_CONTROLLER } from '#controllers/branchController.js'
import { BRANCH_VALIDATION } from '#validations/branchValidation.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import {
  CREATE_BRANCH_FIELDS,
  CREATE_BRANCH_REQUIRED,
  ASSIGN_BRANCH_MANAGER_FIELDS,
  UPDATE_BRANCH_FIELDS,
  UPDATE_BRANCH_STATUS
} from '#constants/branchConstant.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Branch
 *     description: Quản lý chi nhánh
 *
 * /api/v1/branches:
 *   post:
 *     summary: Tạo chi nhánh mới
 *     tags: [Branch]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBranch'
 *     responses:
 *       201:
 *         description: Tạo chi nhánh thành công
 *   get:
 *     summary: Lấy danh sách chi nhánh
 *     tags: [Branch]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc địa chỉ
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Lấy danh sách chi nhánh thành công
 *
 * /api/v1/branches/managers:
 *   get:
 *     summary: Lấy danh sách quản lý chi nhánh
 *     tags: [Branch]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sắp xếp theo trường (name, email)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp (asc, desc)
 *     responses:
 *       200:
 *         description: Lấy danh sách quản lý chi nhánh thành công
 *
 * /api/v1/branches/{id}:
 *   get:
 *     summary: Lấy thông tin chi nhánh theo ID
 *     tags: [Branch]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     responses:
 *       200:
 *         description: Lấy thông tin chi nhánh thành công
 *   put:
 *     summary: Cập nhật thông tin chi nhánh
 *     tags: [Branch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBranch'
 *     responses:
 *       200:
 *         description: Cập nhật chi nhánh thành công
 *   delete:
 *     summary: Xóa chi nhánh
 *     tags: [Branch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     responses:
 *       200:
 *         description: Xóa chi nhánh thành công
 *
 * /api/v1/branches/{id}/manager:
 *   patch:
 *     summary: Gán quản lý cho chi nhánh
 *     tags: [Branch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manager:
 *                 type: string
 *                 description: ID quản lý
 *     responses:
 *       200:
 *         description: Gán quản lý chi nhánh thành công
 *
 * /api/v1/branches/{id}/manager/remove:
 *   patch:
 *     summary: Gỡ quản lý khỏi chi nhánh
 *     tags: [Branch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     responses:
 *       200:
 *         description: Gỡ quản lý chi nhánh thành công
 *
 * /api/v1/branches/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hoạt động của chi nhánh
 *     tags: [Branch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái chi nhánh thành công
 *
 * components:
 *   schemas:
 *     CreateBranch:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           example: Chi nhánh Hà Nội
 *         address:
 *           type: string
 *           example: 123 Đường ABC, Quận 1
 *         manager:
 *           type: string
 *           example: 65f1b2c3d4e5f6a7b8c9d0e1
 *     UpdateBranch:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Chi nhánh Sài Gòn
 *         address:
 *           type: string
 *           example: 456 Đường XYZ, Quận 3
 *         manager:
 *           type: string
 *           example: 65f1b2c3d4e5f6a7b8c9d0e1
 */
router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(CREATE_BRANCH_FIELDS, CREATE_BRANCH_REQUIRED),
  validationHandlingMiddleware({ body: BRANCH_VALIDATION.createBranch }),
  BRANCH_CONTROLLER.createBranch
)

router.get(
  '/',
  apiRateLimiter,
  validationHandlingMiddleware({ query: BRANCH_VALIDATION.query }),
  BRANCH_CONTROLLER.getAllBranches
)

router.get(
  '/managers',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ query: BRANCH_VALIDATION.getAllManagerForBranch }),
  BRANCH_CONTROLLER.getAllManagerForBranch
)

router.get(
  '/:id',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: BRANCH_VALIDATION.idParam }),
  BRANCH_CONTROLLER.getBranchById
)

router.put(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_BRANCH_FIELDS, []),
  validationHandlingMiddleware({
    params: BRANCH_VALIDATION.idParam,
    body: BRANCH_VALIDATION.updateBranch
  }),
  BRANCH_CONTROLLER.updateBranch
)

router.patch(
  '/:id/manager',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(ASSIGN_BRANCH_MANAGER_FIELDS, ['manager']),
  validationHandlingMiddleware({
    params: BRANCH_VALIDATION.idParam,
    body: BRANCH_VALIDATION.assignManager
  }),
  BRANCH_CONTROLLER.assignManager
)

router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({
    params: BRANCH_VALIDATION.idParam
  }),
  BRANCH_CONTROLLER.deleteBranch
)

router.patch(
  '/:id/status',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_BRANCH_STATUS, ['isActive']),
  validationHandlingMiddleware({
    params: BRANCH_VALIDATION.idParam,
    body: BRANCH_VALIDATION.updateBranchStatus
  }),
  BRANCH_CONTROLLER.updateBranchStatus
)

router.patch(
  '/:id/manager/remove',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({
    params: BRANCH_VALIDATION.idParam
  }),
  BRANCH_CONTROLLER.removeManager
)

export const BRANCH_ROUTE = router
