import express from 'express'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { STATISTICS_VALIDATION } from '#validations/statisticsValidation.js'
import { STATISTICS_CONTROLLER } from '#controllers/statisticsController.js'
import { RoleEnum } from '#constants/roleConstant.js'

const Router = express.Router()

Router.use(authorizationMiddleware)

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: APIs thống kê cho Admin, Manager và Staff
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *             periodName:
 *               type: string
 *         overview:
 *           type: object
 *           properties:
 *             totalOrders:
 *               type: number
 *             totalRevenue:
 *               type: number
 *             totalProductsSold:
 *               type: number
 *             totalCustomers:
 *               type: number
 *         orderStatus:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               count:
 *                 type: number
 *               percentage:
 *                 type: number
 *         recentOrders:
 *           type: array
 *           items:
 *             type: object
 *
 *     RevenueStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *         summary:
 *           type: object
 *           properties:
 *             totalRevenue:
 *               type: number
 *             totalOrders:
 *               type: number
 *             averageOrderValue:
 *               type: number
 *         breakdown:
 *           type: array
 *           items:
 *             type: object
 *         byPaymentMethod:
 *           type: array
 *           items:
 *             type: object
 *         byBranch:
 *           type: array
 *           items:
 *             type: object
 *
 *     OrderStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *         summary:
 *           type: object
 *         statusBreakdown:
 *           type: array
 *           items:
 *             type: object
 *         dailyTrend:
 *           type: array
 *           items:
 *             type: object
 *         peakHours:
 *           type: array
 *           items:
 *             type: object
 *
 *     ProductStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *         summary:
 *           type: object
 *         topSelling:
 *           type: array
 *           items:
 *             type: object
 *         lowStock:
 *           type: array
 *           items:
 *             type: object
 *         byCategory:
 *           type: array
 *           items:
 *             type: object
 *
 *     BranchStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *         branches:
 *           type: array
 *           items:
 *             type: object
 *         comparison:
 *           type: object
 *
 *     CustomerStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *         summary:
 *           type: object
 *         topCustomers:
 *           type: array
 *           items:
 *             type: object
 *         newCustomers:
 *           type: array
 *           items:
 *             type: object
 *         orderFrequency:
 *           type: object
 *
 *     PaymentStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *         summary:
 *           type: object
 *         byMethod:
 *           type: array
 *           items:
 *             type: object
 *         byStatus:
 *           type: array
 *           items:
 *             type: object
 *         vnpayBanks:
 *           type: array
 *           items:
 *             type: object
 *
 *     InventoryStatistics:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *         lowStockProducts:
 *           type: array
 *           items:
 *             type: object
 *         outOfStockProducts:
 *           type: array
 *           items:
 *             type: object
 *         stockByBranch:
 *           type: array
 *           items:
 *             type: object
 *
 *     ComparisonStatistics:
 *       type: object
 *       properties:
 *         currentPeriod:
 *           type: object
 *         previousPeriod:
 *           type: object
 *         comparison:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/statistics/dashboard:
 *   get:
 *     summary: Lấy tổng quan dashboard
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *         description: Khoảng thời gian thống kê
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID chi nhánh (chỉ Admin mới có thể chọn)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Ngày bắt đầu (dùng khi period=custom)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Ngày kết thúc (dùng khi period=custom)
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardOverview'
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
Router.get(
  '/dashboard',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.dashboardQuery }),
  STATISTICS_CONTROLLER.getDashboardOverview
)

/**
 * @swagger
 * /api/v1/statistics/revenue:
 *   get:
 *     summary: Thống kê doanh thu
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *           default: day
 *         description: Nhóm dữ liệu theo
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueStatistics'
 */
Router.get(
  '/revenue',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.revenueQuery }),
  STATISTICS_CONTROLLER.getRevenueStatistics
)

/**
 * @swagger
 * /api/v1/statistics/orders:
 *   get:
 *     summary: Thống kê đơn hàng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderStatistics'
 */
Router.get(
  '/orders',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.orderQuery }),
  STATISTICS_CONTROLLER.getOrderStatistics
)

/**
 * @swagger
 * /api/v1/statistics/products:
 *   get:
 *     summary: Thống kê sản phẩm
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Số lượng sản phẩm top bán chạy
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductStatistics'
 */
Router.get(
  '/products',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.productQuery }),
  STATISTICS_CONTROLLER.getProductStatistics
)

/**
 * @swagger
 * /api/v1/statistics/branches:
 *   get:
 *     summary: Thống kê theo chi nhánh (chỉ Admin)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BranchStatistics'
 */
Router.get(
  '/branches',
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.branchQuery }),
  STATISTICS_CONTROLLER.getBranchStatistics
)

/**
 * @swagger
 * /api/v1/statistics/customers:
 *   get:
 *     summary: Thống kê khách hàng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Số lượng top khách hàng
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerStatistics'
 */
Router.get(
  '/customers',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.customerQuery }),
  STATISTICS_CONTROLLER.getCustomerStatistics
)

/**
 * @swagger
 * /api/v1/statistics/payments:
 *   get:
 *     summary: Thống kê thanh toán
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStatistics'
 */
Router.get(
  '/payments',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.paymentQuery }),
  STATISTICS_CONTROLLER.getPaymentStatistics
)

/**
 * @swagger
 * /api/v1/statistics/inventory:
 *   get:
 *     summary: Thống kê tồn kho
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryStatistics'
 */
Router.get(
  '/inventory',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.inventoryQuery }),
  STATISTICS_CONTROLLER.getInventoryStatistics
)

/**
 * @swagger
 * /api/v1/statistics/comparison:
 *   get:
 *     summary: So sánh thống kê giữa các khoảng thời gian
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currentPeriod
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: this_month
 *         description: Khoảng thời gian hiện tại
 *       - in: query
 *         name: previousPeriod
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_week, this_month, last_month, this_quarter, this_year, last_year, custom, all]
 *           default: last_month
 *         description: Khoảng thời gian trước đó để so sánh
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID chi nhánh
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComparisonStatistics'
 */
Router.get(
  '/comparison',
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: STATISTICS_VALIDATION.comparisonQuery }),
  STATISTICS_CONTROLLER.getComparisonStatistics
)

export const STATISTICS_ROUTE = Router
