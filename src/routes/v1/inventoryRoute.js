import express from 'express'
import { INVENTORY_CONTROLLER } from '#controllers/inventoryController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { INVENTORY_CONSTANT } from '#constants/inventoryConstant.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { INVENTORY_VALIDATION } from '#validations/inventoryValidation.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'

const router = express.Router()
router.use(apiRateLimiter)
router.use(authorizationMiddleware)
router.use(requireRoles(RoleEnum.ADMIN))

/**
 * @swagger
 * /api/v1/inventories:
 *   post:
 *     summary: Tạo tồn kho mới
 *     description: Tạo bản ghi tồn kho mới cho sản phẩm
 *     tags: [Inventory]
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
 *               - quantity
 *             properties:
 *               product:
 *                 type: string
 *                 example: '65d0fe4f5311236168a109ca'
 *                 description: ID sản phẩm (24 hex characters)
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 100
 *                 description: Số lượng tồn kho
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 example: 'Kho A - Tầng 1'
 *                 description: Vị trí kho lưu trữ
 *     responses:
 *       201:
 *         description: Tạo tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
// POST - Tạo inventory mới
router.post('/',
  sanitizeRequest(INVENTORY_CONSTANT.CREATE_INVENTORY_FIELDS, INVENTORY_CONSTANT.CREATE_INVENTORY_REQUIRED),
  validationHandlingMiddleware({ body: INVENTORY_VALIDATION.createInventory }),
  INVENTORY_CONTROLLER.createInventory
)

/**
 * @swagger
 * /api/v1/inventories:
 *   get:
 *     summary: Lấy danh sách tất cả tồn kho
 *     description: Lấy danh sách tồn kho với hỗ trợ phân trang và sắp xếp
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *           enum: [quantity, createdAt, updatedAt]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/',
  validationHandlingMiddleware({ query: INVENTORY_VALIDATION.query }),
  INVENTORY_CONTROLLER.getAllInventories
)

/**
 * @swagger
 * /api/v1/inventories/low-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm sắp hết hàng
 *     description: Lấy danh sách sản phẩm có số lượng tồn kho dưới ngưỡng
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Ngưỡng số lượng tối thiểu
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [quantity, createdAt, updatedAt]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm sắp hết hàng thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/low-stock',
  validationHandlingMiddleware({ query: INVENTORY_VALIDATION.query }),
  INVENTORY_CONTROLLER.getLowStockProducts
)

/**
 * @swagger
 * /api/v1/inventories/{inventoryId}:
 *   put:
 *     summary: Cập nhật thông tin tồn kho
 *     description: Cập nhật số lượng và vị trí kho của sản phẩm
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tồn kho (24 hex characters)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 150
 *                 description: Số lượng tồn kho
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 example: 'Kho B - Tầng 2'
 *                 description: Vị trí kho lưu trữ
 *     responses:
 *       200:
 *         description: Cập nhật tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy tồn kho
 */
router.put('/:inventoryId',
  sanitizeRequest(INVENTORY_CONSTANT.UPDATE_INVENTORY_FIELDS),
  validationHandlingMiddleware({
    params: INVENTORY_VALIDATION.inventoryIdParam,
    body: INVENTORY_VALIDATION.updateInventory
  }),
  INVENTORY_CONTROLLER.updateInventory
)

/**
 * @swagger
 * /api/v1/inventories/product/{productId}:
 *   get:
 *     summary: Lấy thông tin tồn kho của sản phẩm
 *     description: Lấy chi tiết tồn kho theo ID sản phẩm
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm (24 hex characters)
 *     responses:
 *       200:
 *         description: Lấy thông tin tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
// GET - Lấy thông tin tồn kho của sản phẩm
router.get('/product/:productId',
  validationHandlingMiddleware({ params: INVENTORY_VALIDATION.productIdParam }),
  INVENTORY_CONTROLLER.getInventory
)

/**
 * @swagger
 * /api/v1/inventories/product/{productId}/adjust:
 *   put:
 *     summary: Điều chỉnh tồn kho
 *     description: Điều chỉnh số lượng tồn kho của sản phẩm (cộng hoặc trừ)
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 50
 *                 description: Số lượng điều chỉnh (có thể âm để trừ, dương để cộng)
 *     responses:
 *       200:
 *         description: Điều chỉnh tồn kho thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
// PUT - Điều chỉnh tồn kho
router.put('/product/:productId/adjust',
  sanitizeRequest(INVENTORY_CONSTANT.ADJUST_INVENTORY_FIELDS, ['quantity']),
  validationHandlingMiddleware({
    params: INVENTORY_VALIDATION.productIdParam,
    body: INVENTORY_VALIDATION.adjustInventory
  }),
  INVENTORY_CONTROLLER.adjustInventory
)

export default router
