import express from 'express'
import { CATEGORY_CONTROLLER } from '#controllers/categoryController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { CATEGORY_VALIDATION } from '#validations/categoryValidation.js'
import {
  CREATE_CATEGORY_FIELDS,
  CREATE_CATEGORY_REQUIRED
} from '#constants/categoryConstant.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: Quản lý danh mục sản phẩm
 *
 * /api/v1/categories:
 *   post:
 *     summary: Tạo danh mục mới
 *     description: Chỉ Admin mới có quyền tạo danh mục mới.
 *     tags: [Category]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategory'
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     summary: Lấy danh sách danh mục
 *     description: Lấy danh sách tất cả danh mục, có hỗ trợ phân trang và tìm kiếm.
 *     tags: [Category]
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
 *         description: Tìm kiếm theo tên danh mục
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
 *       200:
 *         description: Lấy danh sách danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/categories/all:
 *   get:
 *     summary: Lấy tất cả danh mục (không phân trang)
 *     description: Lấy danh sách tất cả danh mục mà không có phân trang, có hỗ trợ tìm kiếm và sắp xếp.
 *     tags: [Category]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên danh mục
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
 *       200:
 *         description: Lấy tất cả danh mục thành công
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
 *                   example: "Lấy tất cả danh mục thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Lấy thông tin danh mục theo ID
 *     description: Lấy chi tiết một danh mục theo ID.
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục
 *     responses:
 *       200:
 *         description: Lấy thông tin danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật danh mục
 *     description: Chỉ Admin mới có quyền cập nhật danh mục.
 *     tags: [Category]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategory'
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa danh mục
 *     description: Chỉ Admin mới có quyền xóa danh mục.
 *     tags: [Category]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục
 *     responses:
 *       200:
 *         description: Xóa danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * /api/v1/categories/{id}/status:
 *   patch:
 *    summary: Cập nhật trạng thái danh mục
 *    description: Chỉ Admin mới có quyền cập nhật trạng thái danh mục.
 *    tags: [Category]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: ID danh mục
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              isActive:
 *                type: boolean
 *                example: true
 *    responses:
 *      200:
 *        description: Cập nhật trạng thái danh mục thành công
 * components:
 *   schemas:
 *     CreateCategory:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Điện thoại"
 *         description:
 *           type: string
 *           example: "Danh mục các sản phẩm điện thoại"
 *     UpdateCategory:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Điện thoại"
 *         description:
 *           type: string
 *           example: "Danh mục các sản phẩm điện thoại"
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65f1b2c3d4e5f6a7b8c9d0e1"
 *         name:
 *           type: string
 *           example: "Điện thoại"
 *         description:
 *           type: string
 *           example: "Danh mục các sản phẩm điện thoại"
 *         slug:
 *           type: string
 *           example: "dien-thoai"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdBy:
 *           type: string
 *           example: "65f1b2c3d4e5f6a7b8c9d0e1"
 *         updatedBy:
 *           type: string
 *           example: "65f1b2c3d4e5f6a7b8c9d0e1"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy thông tin danh mục thành công"
 *         data:
 *           $ref: '#/components/schemas/Category'
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy danh sách danh mục thành công"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             totalPages:
 *               type: integer
 *               example: 5
 *             totalResults:
 *               type: integer
 *               example: 50
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Xóa danh mục thành công"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         code:
 *           type: string
 *           example: "NOT_FOUND"
 *         message:
 *           type: string
 *           example: "Yêu cầu không tồn tại."
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *   responses:
 *     BadRequest:
 *       description: Yêu cầu không hợp lệ
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     Unauthorized:
 *       description: Không có quyền truy cập
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     Forbidden:
 *       description: Bị từ chối truy cập
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     NotFound:
 *       description: Không tìm thấy tài nguyên
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */

router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(CREATE_CATEGORY_FIELDS, CREATE_CATEGORY_REQUIRED),
  validationHandlingMiddleware({ body: CATEGORY_VALIDATION.createCategory }),
  CATEGORY_CONTROLLER.createCategory
)

router.get(
  '/',
  apiRateLimiter,
  validationHandlingMiddleware({ query: CATEGORY_VALIDATION.query }),
  CATEGORY_CONTROLLER.getAllCategories
)

router.get(
  '/all',
  apiRateLimiter,
  validationHandlingMiddleware({ query: CATEGORY_VALIDATION.queryNoPagination }),
  CATEGORY_CONTROLLER.getAllCategoriesWithoutPagination
)

router.get(
  '/:id',
  apiRateLimiter,
  validationHandlingMiddleware({ params: CATEGORY_VALIDATION.idParam }),
  CATEGORY_CONTROLLER.getCategoryById
)
router.put(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(CREATE_CATEGORY_FIELDS, []),
  validationHandlingMiddleware({
    params: CATEGORY_VALIDATION.idParam,
    body: CATEGORY_VALIDATION.updateCategory
  }),
  CATEGORY_CONTROLLER.updateCategory
)

router.patch(
  '/:id/status',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({
    params: CATEGORY_VALIDATION.idParam,
    body: CATEGORY_VALIDATION.updateCategoryStatus
  }),
  CATEGORY_CONTROLLER.updateCategoryStatus
)
router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: CATEGORY_VALIDATION.idParam }),
  CATEGORY_CONTROLLER.deleteCategoryById
)
export const CATEGORY_ROUTE = router
