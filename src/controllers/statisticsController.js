import { STATISTICS_SERVICE } from '#services/statisticsService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

/**
 * Get branch ID based on user role
 * Admin: can view all branches or specific branch
 * Manager/Staff: can only view their assigned branch
 */
const getBranchFilter = (req) => {
  const { role, branch: userBranch } = req.user
  const { branchId } = req.validated.query

  // Admin can view all or specific branch
  if (role === 'admin') {
    return branchId || null
  }

  // Manager/Staff can only view their branch
  if (role === 'manager' || role === 'staff') {
    return userBranch || null
  }

  return null
}

/**
 * Get Dashboard Overview
 * GET /api/statistics/dashboard
 * For: Admin, Manager, Staff
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getDashboardOverview(branchId, period, startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê tổng quan thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Revenue Statistics
 * GET /api/statistics/revenue
 * For: Admin, Manager
 */
const getRevenueStatistics = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', groupBy = 'day', startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getRevenueStatistics(branchId, period, groupBy, startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê doanh thu thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Order Statistics
 * GET /api/statistics/orders
 * For: Admin, Manager, Staff
 */
const getOrderStatistics = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getOrderStatistics(branchId, period, startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Product Statistics
 * GET /api/statistics/products
 * For: Admin, Manager
 */
const getProductStatistics = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', limit = 10, startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getProductStatistics(branchId, period, parseInt(limit), startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê sản phẩm thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Branch Statistics
 * GET /api/statistics/branches
 * For: Admin only
 */
const getBranchStatistics = async (req, res, next) => {
  try {
    const { period = 'this_month', startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getBranchStatistics(period, startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê chi nhánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Customer Statistics
 * GET /api/statistics/customers
 * For: Admin, Manager
 */
const getCustomerStatistics = async (req, res, next) => {
  try {
    const { period = 'this_month', limit = 10, startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getCustomerStatistics(period, parseInt(limit), startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê khách hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Payment Statistics
 * GET /api/statistics/payments
 * For: Admin, Manager
 */
const getPaymentStatistics = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getPaymentStatistics(branchId, period, startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê thanh toán thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Inventory Statistics
 * GET /api/statistics/inventory
 * For: Admin, Manager, Staff
 */
const getInventoryStatistics = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)

    const result = await STATISTICS_SERVICE.getInventoryStatistics(branchId)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê tồn kho thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Comparison Statistics
 * GET /api/statistics/comparison
 * For: Admin, Manager
 */
const getComparisonStatistics = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { currentPeriod = 'this_month', previousPeriod = 'last_month' } = req.validated.query

    const result = await STATISTICS_SERVICE.getComparisonStatistics(branchId, currentPeriod, previousPeriod)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê so sánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Branch Performance Metrics
 * GET /api/statistics/branches/performance
 * For: Admin only
 */
const getBranchPerformanceMetrics = async (req, res, next) => {
  try {
    const { period = 'this_month', limit = 10, startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getBranchPerformanceMetrics(period, startDate, endDate, parseInt(limit))

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy thống kê hiệu suất chi nhánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Recent Orders for Dashboard
 * GET /api/statistics/recent-orders
 * For: Admin, Manager, Staff
 */
const getRecentOrdersForDashboard = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', limit = 10, page = 1, startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getRecentOrdersForDashboard(
      branchId,
      period,
      parseInt(limit),
      parseInt(page),
      startDate,
      endDate
    )

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        period: result.period,
        dateRange: result.dateRange,
        message: 'Lấy danh sách đơn hàng gần đây thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Order Status Summary
 * GET /api/statistics/order-status-summary
 * For: Admin, Manager, Staff
 */
const getOrderStatusSummary = async (req, res, next) => {
  try {
    const branchId = getBranchFilter(req)
    const { period = 'this_month', startDate, endDate } = req.validated.query

    const result = await STATISTICS_SERVICE.getOrderStatusSummary(branchId, period, startDate, endDate)

    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result,
        message: 'Lấy tóm tắt trạng thái đơn hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const STATISTICS_CONTROLLER = {
  getDashboardOverview,
  getRevenueStatistics,
  getOrderStatistics,
  getProductStatistics,
  getBranchStatistics,
  getBranchPerformanceMetrics,
  getCustomerStatistics,
  getPaymentStatistics,
  getInventoryStatistics,
  getComparisonStatistics,
  getRecentOrdersForDashboard,
  getOrderStatusSummary
}
