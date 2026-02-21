import { Router } from 'express'
import { STORE_INVENTORY_CONTROLLER } from '#controllers/storeInventoryController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { STORE_INVENTORY_VALIDATION } from '#validations/storeInventoryValidation.js'
import { STORE_INVENTORY_CONSTANT } from '#constants/storeInventoryConstant.js'

const router = Router()
router.use(apiRateLimiter)

/**
 * @swagger
 * /api/v1/store-inventories:
 *   post:
 *     summary: Tạo tồn kho cho chi nhánh (admin, manager only)
 *     description: Tạo bản ghi tồn kho mới cho sản phẩm tại chi nhánh cụ thể với ngưỡng tối thiểu và tối đa
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
 *                 default: 0
 *                 example: 50
 *                 description: Số lượng tồn kho ban đầu
 *               minThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 default: 10
 *                 example: 10
 *                 description: Ngưỡng tối thiểu - cảnh báo khi số lượng dưới ngưỡng này
 *               maxThreshold:
 *                 type: integer
 *                 minimum: 1
 *                 default: 100
 *                 example: 100
 *                 description: Ngưỡng tối đa - cảnh báo khi số lượng vượt ngưỡng này
 *     responses:
 *       201:
 *         description: Tạo tồn kho chi nhánh thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin, Manager)
 *       409:
 *         description: Tồn kho đã tồn tại cho sản phẩm này tại chi nhánh
 */
// POST - Tạo tồn kho cho chi nhánh
router.post('/',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  sanitizeRequest(STORE_INVENTORY_CONSTANT.CREATE_STORE_INVENTORY, STORE_INVENTORY_CONSTANT.CREATE_STORE_INVENTORY_REQUIRED),
  validationHandlingMiddleware({ body: STORE_INVENTORY_VALIDATION.createStoreInventory }),
  STORE_INVENTORY_CONTROLLER.createStoreInventory
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}/out-of-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm hết hàng tại chi nhánh (admin, manager, staff)
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
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getOutOfStockProductsAtBranch
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}/low-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm tồn kho thấp tại chi nhánh (admin, manager)
 *     description: Lấy danh sách sản phẩm có số lượng tồn kho dưới ngưỡng tối thiểu tại chi nhánh cụ thể
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
 *         description: Lấy danh sách sản phẩm tồn kho thấp thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy chi nhánh
 */
// GET - Lấy danh sách sản phẩm tồn kho thấp tại chi nhánh
router.get('/:branchId/low-stock',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getLowStockProductsAtBranch
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}/need-restock:
 *   get:
 *     summary: Lấy danh sách sản phẩm cần bổ sung tồn kho (admin, manager)
 *     description: Lấy danh sách sản phẩm cần yêu cầu bổ sung từ kho chính (dưới ngưỡng tối thiểu)
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
 *         description: Lấy danh sách sản phẩm cần bổ sung thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy chi nhánh
 */
// GET - Lấy danh sách sản phẩm cần bổ sung tồn kho
router.get('/:branchId/need-restock',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getNeedRestockProducts
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}/overstock:
 *   get:
 *     summary: Lấy danh sách sản phẩm tồn kho quá mức (admin, manager)
 *     description: Lấy danh sách sản phẩm có số lượng tồn kho vượt ngưỡng tối đa tại chi nhánh cụ thể
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
 *         description: Lấy danh sách sản phẩm tồn kho quá mức thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy chi nhánh
 */
// GET - Lấy danh sách sản phẩm tồn kho quá mức
router.get('/:branchId/overstock',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getOverstockProducts
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}:
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
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchIdParam, query: STORE_INVENTORY_VALIDATION.query }),
  STORE_INVENTORY_CONTROLLER.getStoreInventoriesByBranch
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}/{productId}/thresholds:
 *   patch:
 *     summary: Cập nhật ngưỡng tồn kho (admin, manager)
 *     description: Cập nhật ngưỡng tối thiểu và/hoặc ngưỡng tối đa cho sản phẩm tại chi nhánh
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *                 description: Ngưỡng tối thiểu
 *               maxThreshold:
 *                 type: integer
 *                 minimum: 1
 *                 example: 100
 *                 description: Ngưỡng tối đa
 *     responses:
 *       200:
 *         description: Cập nhật ngưỡng tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin và Manager)
 *       404:
 *         description: Không tìm thấy tồn kho
 */
// PATCH - Cập nhật ngưỡng tồn kho
router.patch('/:branchId/:productId/thresholds',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({
    params: STORE_INVENTORY_VALIDATION.branchAndProductIdParam,
    body: STORE_INVENTORY_VALIDATION.updateThresholds
  }),
  STORE_INVENTORY_CONTROLLER.updateThresholds
)

/**
 * @swagger
 * /api/v1/store-inventories/{branchId}/{productId}:
 *   get:
 *     summary: Lấy tồn kho sản phẩm tại chi nhánh (admin, manager, staff)
 *     description: Lấy chi tiết tồn kho của một sản phẩm cụ thể tại chi nhánh
 *     tags: [Store Inventory]
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
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.branchAndProductIdParam }),
  STORE_INVENTORY_CONTROLLER.getStoreInventory
)

/**
 * @swagger
 * /api/v1/store-inventories/{inventoryId}:
 *   delete:
 *     summary: Xóa tồn kho tại chi nhánh (admin only)
 *     description: Xóa mềm (soft delete) bản ghi tồn kho tại chi nhánh
 *     tags: [Store Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tồn kho (24 hex characters)
 *     responses:
 *       200:
 *         description: Xóa tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 *       404:
 *         description: Không tìm thấy tồn kho
 */
// DELETE - Xóa tồn kho (soft delete)
router.delete('/:inventoryId',
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: STORE_INVENTORY_VALIDATION.inventoryIdParam }),
  STORE_INVENTORY_CONTROLLER.deleteStoreInventory
)

export default router
