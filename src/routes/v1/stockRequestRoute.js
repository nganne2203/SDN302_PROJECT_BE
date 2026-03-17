import express from 'express'
import { STOCK_REQUEST_CONTROLLER } from '#controllers/stockRequestController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { STOCK_REQUEST_CONSTANT } from '#constants/stockRequestConstant.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { STOCK_REQUEST_VALIDATION } from '#validations/stockRequestValidation.js'

const router = express.Router()
router.use(apiRateLimiter)
router.use(authorizationMiddleware)

/**
 * @swagger
 * /api/v1/stock-requests:
 *   post:
 *     summary: Tạo yêu cầu nhập hàng mới (Manager only)
 *     description: Tạo một yêu cầu nhập hàng mới từ chi nhánh
 *     tags: [Stock Request]
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
 *               - quantity
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
 *                 minimum: 1
 *                 example: 50
 *                 description: Số lượng yêu cầu nhập
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: 'Sản phẩm hết hàng'
 *                 description: Lý do yêu cầu nhập hàng
 *     responses:
 *       201:
 *         description: Tạo yêu cầu nhập hàng thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Manager mới có thể tạo)
 */
// POST - Tạo yêu cầu nhập hàng
router.post('/',
  requireRoles(RoleEnum.MANAGER),
  sanitizeRequest(STOCK_REQUEST_CONSTANT.CREATE_STOCK_REQUEST, STOCK_REQUEST_CONSTANT.CREATE_STOCK_REQUEST_REQUIRED),
  validationHandlingMiddleware({ body: STOCK_REQUEST_VALIDATION.createStockRequest }),
  STOCK_REQUEST_CONTROLLER.createStockRequest
)

/**
 * @swagger
 * /api/v1/stock-requests:
 *   get:
 *     summary: Lấy danh sách tất cả yêu cầu nhập hàng (admin only)
 *     description: Lấy danh sách yêu cầu nhập hàng với hỗ trợ phân trang, lọc và sắp xếp
 *     tags: [Stock Request]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, quantity, status]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Lọc theo ID chi nhánh
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Lọc theo ID sản phẩm
 *     responses:
 *       200:
 *         description: Lấy danh sách yêu cầu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 */
// GET - Lấy danh sách tất cả yêu cầu
router.get('/',
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ query: STOCK_REQUEST_VALIDATION.query }),
  STOCK_REQUEST_CONTROLLER.getAllStockRequests
)

/**
 * @swagger
 * /api/v1/stock-requests/pending:
 *   get:
 *     summary: Lấy danh sách yêu cầu chưa xử lý (pending) (admin only)
 *     description: Lấy danh sách yêu cầu nhập hàng có trạng thái chờ xử lý (pending)
 *     tags: [Stock Request]
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
 *           enum: [createdAt, quantity, status]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách yêu cầu chờ xử lý thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 */
// GET - Lấy danh sách yêu cầu chưa xử lý
router.get('/pending',
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ query: STOCK_REQUEST_VALIDATION.query }),
  STOCK_REQUEST_CONTROLLER.getPendingStockRequests
)

/**
 * @swagger
 * /api/v1/stock-requests/branch/{branchId}:
 *   get:
 *     summary: Lấy danh sách yêu cầu của chi nhánh (Manager và Admin)
 *     description: Lấy danh sách yêu cầu nhập hàng theo chi nhánh cụ thể
 *     tags: [Stock Request]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, quantity, status]
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách yêu cầu chi nhánh thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (Manager và Admin)
 *       404:
 *         description: Không tìm thấy chi nhánh
 */
// GET - Lấy danh sách yêu cầu của chi nhánh
router.get('/branch/:branchId',
  requireRoles(RoleEnum.MANAGER, RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: STOCK_REQUEST_VALIDATION.branchIdParam, query: STOCK_REQUEST_VALIDATION.query }),
  STOCK_REQUEST_CONTROLLER.getStockRequestsByBranch
)

/**
 * @swagger
 * /api/v1/stock-requests/{requestId}:
 *   get:
 *     summary: Lấy chi tiết yêu cầu nhập hàng (Manager và Admin)
 *     description: Lấy thông tin chi tiết của một yêu cầu nhập hàng cụ thể
 *     tags: [Stock Request]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID yêu cầu (24 hex characters)
 *     responses:
 *       200:
 *         description: Lấy chi tiết yêu cầu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (Manager và Admin)
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
// GET - Lấy chi tiết yêu cầu
router.get('/:requestId',
  requireRoles(RoleEnum.MANAGER, RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: STOCK_REQUEST_VALIDATION.requestIdParam }),
  STOCK_REQUEST_CONTROLLER.getStockRequestDetail
)

/**
 * @swagger
 * /api/v1/stock-requests/{requestId}/approve:
 *   put:
 *     summary: Phê duyệt yêu cầu nhập hàng (Admin only)
 *     description: Phê duyệt một yêu cầu nhập hàng theo số lượng được duyệt
 *     tags: [Stock Request]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID yêu cầu (24 hex characters)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvedQuantity
 *             properties:
 *               approvedQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *                 description: Số lượng được duyệt
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 example: 'Đã phê duyệt, sẽ giao hàng trong 2 ngày'
 *                 description: Ghi chú khi phê duyệt (tùy chọn)
 *     responses:
 *       200:
 *         description: Phê duyệt yêu cầu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 *       404:
 *         description: Không tìm thấy yêu cầu
 *       409:
 *         description: Yêu cầu không ở trạng thái chờ xử lý
 */
// PUT - Phê duyệt yêu cầu
router.put('/:requestId/approve',
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(STOCK_REQUEST_CONSTANT.APPROVE_STOCK_REQUEST),
  validationHandlingMiddleware({
    params: STOCK_REQUEST_VALIDATION.requestIdParam,
    body: STOCK_REQUEST_VALIDATION.approveStockRequest
  }),
  STOCK_REQUEST_CONTROLLER.approveStockRequest
)

// PATCH - Backward compatibility for existing clients
router.patch('/:requestId/approve',
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(STOCK_REQUEST_CONSTANT.APPROVE_STOCK_REQUEST),
  validationHandlingMiddleware({
    params: STOCK_REQUEST_VALIDATION.requestIdParam,
    body: STOCK_REQUEST_VALIDATION.approveStockRequest
  }),
  STOCK_REQUEST_CONTROLLER.approveStockRequest
)

/**
 * @swagger
 * /api/v1/stock-requests/{requestId}/reject:
 *   patch:
 *     summary: Từ chối yêu cầu nhập hàng (Admin only)
 *     description: Từ chối một yêu cầu nhập hàng và cập nhật trạng thái thành rejected
 *     tags: [Stock Request]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID yêu cầu (24 hex characters)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 example: 'Sản phẩm này không còn được bán'
 *                 description: Lý do từ chối (bắt buộc)
 *     responses:
 *       200:
 *         description: Từ chối yêu cầu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 *       404:
 *         description: Không tìm thấy yêu cầu
 *       409:
 *         description: Yêu cầu không ở trạng thái chờ xử lý
 */
// PATCH - Từ chối yêu cầu
router.patch('/:requestId/reject',
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(STOCK_REQUEST_CONSTANT.REJECT_STOCK_REQUEST),
  validationHandlingMiddleware({
    params: STOCK_REQUEST_VALIDATION.requestIdParam,
    body: STOCK_REQUEST_VALIDATION.rejectStockRequest
  }),
  STOCK_REQUEST_CONTROLLER.rejectStockRequest
)

export default router
