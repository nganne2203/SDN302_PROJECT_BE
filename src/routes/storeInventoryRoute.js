import { Router } from 'express'
import { STORE_INVENTORY_CONTROLLER } from '#controllers/storeInventoryController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingmiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { STORE_INVENTORY_VALIDATION } from '#validations/storeInventoryValidation.js'
import { STORE_INVENTORY_CONSTANT } from '#constants/storeInventoryConstant.js'

const router = Router()
router.use(apiRateLimiter)
router.use(authorizationMiddleware)

/**
 * @swagger
 * /api/store-inventories:
 *   post:
 *     summary: Tạo tồn kho cho chi nhánh
 *     description: Tạo bản ghi tồn kho mới cho sản phẩm tại chi nhánh cụ thể
 *     tags: [Store Inventory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch
 *               - product
 *             properties:
 *               branch:
 *                 type: string
 *                 example: '65d0fe4f5311236168a109ca'
 *                 description: ID chi nhánh (24 hex characters)
 *               product:
 *                 type: string
 *                 example: '65d0fe4f5311236168a109ca'
 *                 description: ID sản phẩm (24 hex characters)
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *                 description: Số lượng tồn kho tại chi nhánh
 *     responses:
 *       201:
 *         description: Tạo tồn kho chi nhánh thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 *       409:
 *         description: Tồn kho đã tồn tại cho sản phẩm này tại chi nhánh
 */
// POST - Tạo tồn kho cho chi nhánh
router.post('/',
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(STORE_INVENTORY_CONSTANT.CREATE_STORE_INVENTORY, STORE_INVENTORY_CONSTANT.CREATE_STORE_INVENTORY_REQUIRED),
  validationHandlingMiddleware({ body: STORE_INVENTORY_VALIDATION.createStoreInventory }),
  STORE_INVENTORY_CONTROLLER.createStoreInventory
)

/**
 * @swagger
 * /api/store-inventories/{branchId}:
 *   get:
 *     summary: Lấy danh sách tồn kho tại chi nhánh
 *     description: Lấy danh sách tất cả sản phẩm có tồn kho tại chi nhánh cụ thể
 *     tags: [Store Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh (24 hex characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số trang (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Số bản ghi trên một trang (mặc định 10)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [quantity, createdAt]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách tồn kho chi nhánh thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy chi nhánh
 */
// GET - Lấy danh sách tồn kho tại chi nhánh
router.get('/:branchId',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getStoreInventoriesByBranch
)

/**
 * @swagger
 * /api/store-inventories/{branchId}/out-of-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm hết hàng tại chi nhánh
 *     description: Lấy danh sách sản phẩm có số lượng tồn kho bằng 0 tại chi nhánh cụ thể
 *     tags: [Store Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh (24 hex characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số trang (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Số bản ghi trên một trang (mặc định 10)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [quantity, createdAt]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm hết hàng thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy chi nhánh
 */
// GET - Lấy danh sách sản phẩm hết hàng tại chi nhánh
router.get('/:branchId/out-of-stock',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getOutOfStockProductsAtBranch
)

/**
 * @swagger
 * /api/store-inventories/{branchId}/{productId}:
 *   get:
 *     summary: Lấy tồn kho sản phẩm tại chi nhánh
 *     description: Lấy chi tiết tồn kho của một sản phẩm cụ thể tại chi nhánh
 *     tags: [Store Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chi nhánh (24 hex characters)
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm (24 hex characters)
 *     responses:
 *       200:
 *         description: Lấy tồn kho sản phẩm thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy chi nhánh hoặc sản phẩm
 */
// GET - Lấy tồn kho sản phẩm tại chi nhánh
router.get('/:branchId/:productId',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchAndProductIdParam }),
  STORE_INVENTORY_CONTROLLER.getStoreInventory
)

export default router
