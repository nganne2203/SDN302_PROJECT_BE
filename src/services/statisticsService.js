import { STATISTICS_REPOSITORY } from '#repositories/statisticsRepository.js'
import { orderModel } from '#models/orderModel.js'

/**
 * Get date range filter based on period
 */
const getDateRange = (period, customStart, customEnd) => {
  const now = new Date()
  let startDate, endDate

  switch (period) {
  case 'today':
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    break
  case 'yesterday':
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    break
  case 'this_week': {
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    startDate = new Date(now.setDate(diff))
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date()
    break
  }
  case 'last_week': {
    const lastWeekEnd = new Date(now)
    lastWeekEnd.setDate(now.getDate() - now.getDay())
    lastWeekEnd.setHours(23, 59, 59, 999)
    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
    lastWeekStart.setHours(0, 0, 0, 0)
    startDate = lastWeekStart
    endDate = lastWeekEnd
    break
  }
  case 'this_month':
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    break
  case 'last_month':
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    break
  case 'this_quarter': {
    const quarter = Math.floor(now.getMonth() / 3)
    startDate = new Date(now.getFullYear(), quarter * 3, 1)
    endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
    break
  }
  case 'this_year':
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    break
  case 'last_year':
    startDate = new Date(now.getFullYear() - 1, 0, 1)
    endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
    break
  case 'custom':
    startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = customEnd ? new Date(customEnd) : new Date()
    break
  default: // all time
    startDate = null
    endDate = null
  }

  return { startDate, endDate }
}

/**
 * Get date group format for aggregation based on groupBy parameter
 */
const getDateGroupFormat = (groupBy) => {
  switch (groupBy) {
  case 'hour':
    return { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } }
  case 'day':
    return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
  case 'week':
    return { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }
  case 'month':
    return { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
  case 'year':
    return { $dateToString: { format: '%Y', date: '$createdAt' } }
  default:
    return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
  }
}

/**
 * Dashboard Overview Statistics
 * For: Admin, Manager, Staff
 */
const getDashboardOverview = async (branchId = null, period = 'this_month', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, startDate, endDate)

  // Fetch all data in parallel
  const [orderStats, productsSold, newCustomers, activeProducts, lowStockProducts, outOfStockProducts, recentOrders] = await Promise.all([
    STATISTICS_REPOSITORY.getOrderOverviewStats(matchStage),
    STATISTICS_REPOSITORY.getProductsSoldStats(matchStage),
    STATISTICS_REPOSITORY.getNewCustomersCount(startDate, endDate),
    STATISTICS_REPOSITORY.getActiveProductsCount(),
    STATISTICS_REPOSITORY.getLowStockProductsCount(),
    STATISTICS_REPOSITORY.getOutOfStockProductsCount(),
    STATISTICS_REPOSITORY.getRecentOrders(matchStage, 5)
  ])

  const stats = orderStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    canceledOrders: 0,
    averageOrderValue: 0
  }

  // Calculate completion rate
  const totalConfirmed = stats.confirmedOrders + stats.shippedOrders + stats.deliveredOrders
  const completionRate = stats.totalOrders > 0 ? Math.round((totalConfirmed / stats.totalOrders) * 100) : 0

  // Count active transactions (non-pending, non-canceled)
  const activeTransactions = totalConfirmed

  return {
    period,
    dateRange: { startDate, endDate },
    overview: {
      totalOrders: stats.totalOrders,
      totalRevenue: Math.round(stats.totalRevenue),
      totalProductsSold: productsSold[0]?.totalQuantity || 0,
      totalCustomers: newCustomers,
      averageOrderValue: Math.round(stats.averageOrderValue || 0)
    },
    orders: {
      total: stats.totalOrders,
      pending: stats.pendingOrders,
      confirmed: stats.confirmedOrders,
      shipped: stats.shippedOrders,
      delivered: stats.deliveredOrders,
      cancelled: stats.canceledOrders,
      activeTransactions: activeTransactions
    },
    revenue: {
      total: Math.round(stats.totalRevenue),
      averageOrderValue: Math.round(stats.averageOrderValue || 0)
    },
    products: {
      totalActive: activeProducts,
      totalSold: productsSold[0]?.totalQuantity || 0,
      lowStock: lowStockProducts[0]?.count || 0,
      outOfStock: outOfStockProducts[0]?.count || 0
    },
    customers: {
      newCustomers
    },
    performance: {
      completionRate: completionRate,
      successRate: completionRate
    },
    recentOrders: recentOrders.map(order => ({
      orderNumber: order.orderNumber,
      customer: order.user?.fullname || 'N/A',
      status: order.orderStatus,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      branch: order.branch?.name || 'N/A',
      createdAt: order.createdAt
    }))
  }
}

/**
 * Revenue Statistics
 * For: Admin, Manager
 */
const getRevenueStatistics = async (branchId = null, period = 'this_month', groupBy = 'day', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, startDate, endDate)
  const dateGroupFormat = getDateGroupFormat(groupBy)

  const revenueByPeriod = await STATISTICS_REPOSITORY.getRevenueByPeriod(matchStage, dateGroupFormat)

  // Calculate totals
  const totals = revenueByPeriod.reduce((acc, item) => {
    acc.totalRevenue += item.revenue
    acc.totalOrders += item.orders
    return acc
  }, { totalRevenue: 0, totalOrders: 0 })

  return {
    period,
    groupBy,
    dateRange: { startDate, endDate },
    data: revenueByPeriod.map(item => ({
      date: item._id,
      revenue: Math.round(item.revenue),
      orders: item.orders,
      averageOrderValue: Math.round(item.averageOrderValue)
    })),
    summary: {
      totalRevenue: Math.round(totals.totalRevenue),
      totalOrders: totals.totalOrders,
      averageOrderValue: totals.totalOrders > 0 ? Math.round(totals.totalRevenue / totals.totalOrders) : 0
    }
  }
}

/**
 * Order Statistics
 * For: Admin, Manager, Staff
 */
const getOrderStatistics = async (branchId = null, period = 'this_month', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, startDate, endDate)

  // Fetch all data in parallel
  const [ordersByStatus, ordersByPaymentMethod, ordersByDeliveryStatus, recentOrders] = await Promise.all([
    STATISTICS_REPOSITORY.getOrdersByStatus(matchStage),
    STATISTICS_REPOSITORY.getOrdersByPaymentMethod(matchStage),
    STATISTICS_REPOSITORY.getOrdersByDeliveryStatus(matchStage),
    STATISTICS_REPOSITORY.getRecentOrders(matchStage, 10)
  ])

  // Format results
  const statusMap = {}
  ordersByStatus.forEach(item => {
    statusMap[item._id] = { count: item.count, totalAmount: Math.round(item.totalAmount) }
  })

  const paymentMethodMap = {}
  ordersByPaymentMethod.forEach(item => {
    paymentMethodMap[item._id] = { count: item.count, totalAmount: Math.round(item.totalAmount) }
  })

  const deliveryStatusMap = {}
  ordersByDeliveryStatus.forEach(item => {
    deliveryStatusMap[item._id] = item.count
  })

  return {
    period,
    dateRange: { startDate, endDate },
    byStatus: statusMap,
    byPaymentMethod: paymentMethodMap,
    byDeliveryStatus: deliveryStatusMap,
    recentOrders: recentOrders.map(order => ({
      orderNumber: order.orderNumber,
      customer: order.user?.fullname || 'N/A',
      status: order.orderStatus,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      branch: order.branch?.name || 'N/A',
      createdAt: order.createdAt
    }))
  }
}

/**
 * Product Statistics
 * For: Admin, Manager
 */
const getProductStatistics = async (branchId = null, period = 'this_month', limit = 10, customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, startDate, endDate)

  // Fetch all data in parallel
  const [topSellingProducts, topRevenueProducts, productsByCategory] = await Promise.all([
    STATISTICS_REPOSITORY.getTopSellingProducts(matchStage, limit),
    STATISTICS_REPOSITORY.getTopRevenueProducts(matchStage, limit),
    STATISTICS_REPOSITORY.getProductsByCategory(matchStage)
  ])

  return {
    period,
    dateRange: { startDate, endDate },
    topSellingProducts: topSellingProducts.map(p => ({
      ...p,
      totalRevenue: Math.round(p.totalRevenue)
    })),
    topRevenueProducts: topRevenueProducts.map(p => ({
      ...p,
      totalRevenue: Math.round(p.totalRevenue)
    })),
    byCategory: productsByCategory.map(c => ({
      ...c,
      totalRevenue: Math.round(c.totalRevenue)
    }))
  }
}

/**
 * Branch Statistics
 * For: Admin
 */
const getBranchStatistics = async (period = 'this_month', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  // Get all active branches
  const branches = await STATISTICS_REPOSITORY.getActiveBranches()

  // Fetch statistics for each branch in parallel
  const branchStats = await Promise.all(branches.map(async (branch) => {
    const [orderStats, inventoryValue] = await Promise.all([
      STATISTICS_REPOSITORY.getBranchOrderStats(branch._id, startDate, endDate),
      STATISTICS_REPOSITORY.getBranchInventoryValue(branch._id)
    ])

    const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, deliveredOrders: 0, canceledOrders: 0 }
    const inventory = inventoryValue[0] || { totalValue: 0, totalItems: 0 }

    return {
      branchId: branch._id,
      branchName: branch.name,
      address: branch.address,
      orders: {
        total: stats.totalOrders,
        delivered: stats.deliveredOrders,
        canceled: stats.canceledOrders
      },
      revenue: Math.round(stats.totalRevenue),
      inventory: {
        totalItems: inventory.totalItems,
        totalValue: Math.round(inventory.totalValue)
      }
    }
  }))

  // Sort by revenue
  branchStats.sort((a, b) => b.revenue - a.revenue)

  return {
    period,
    dateRange: { startDate, endDate },
    branches: branchStats,
    summary: {
      totalBranches: branches.length,
      totalRevenue: branchStats.reduce((sum, b) => sum + b.revenue, 0),
      totalOrders: branchStats.reduce((sum, b) => sum + b.orders.total, 0)
    }
  }
}

/**
 * Branch Performance Statistics with detailed metrics
 * For: Admin
 * Returns: Branch name, revenue, orders, quantities, manager, status
 */
const getBranchPerformanceMetrics = async (period = 'this_month', customStart = null, customEnd = null, limit = 10) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  const branchPerformance = await STATISTICS_REPOSITORY.getBranchPerformance(startDate, endDate, limit)

  return {
    period,
    dateRange: { startDate, endDate },
    branches: branchPerformance.map(branch => ({
      branchId: branch._id,
      branchName: branch.branchName,
      address: branch.address,
      manager: branch.manager || 'Chưa gán',
      managerEmail: branch.managerEmail || '',
      revenue: Math.round(branch.totalRevenue),
      orders: branch.totalOrders,
      quantity: branch.totalQuantity,
      status: branch.status ? 'Hoạt động' : 'Không hoạt động'
    })),
    summary: {
      totalBranches: branchPerformance.length,
      totalRevenue: Math.round(branchPerformance.reduce((sum, b) => sum + (b.totalRevenue || 0), 0)),
      totalOrders: branchPerformance.reduce((sum, b) => sum + (b.totalOrders || 0), 0),
      totalQuantity: branchPerformance.reduce((sum, b) => sum + (b.totalQuantity || 0), 0)
    }
  }
}

/**
 * Customer Statistics
 * For: Admin, Manager
 */
const getCustomerStatistics = async (period = 'this_month', limit = 10, customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(null, startDate, endDate)

  // Fetch all data in parallel
  const [topCustomers, customerTypes] = await Promise.all([
    STATISTICS_REPOSITORY.getTopCustomers(matchStage, limit),
    STATISTICS_REPOSITORY.getCustomerTypes(matchStage)
  ])

  const customerTypeStats = customerTypes[0] || { newCustomers: 0, returningCustomers: 0, totalCustomers: 0 }

  return {
    period,
    dateRange: { startDate, endDate },
    topCustomers: topCustomers.map(c => ({
      ...c,
      totalSpent: Math.round(c.totalSpent),
      averageOrderValue: Math.round(c.averageOrderValue)
    })),
    customerTypes: customerTypeStats
  }
}

/**
 * Payment Statistics
 * For: Admin, Manager
 */
// eslint-disable-next-line no-unused-vars
const getPaymentStatistics = async (branchId = null, period = 'this_month', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(null, startDate, endDate)

  // Fetch all data in parallel
  const [paymentsByStatus, paymentsByMethod, paymentCounts] = await Promise.all([
    STATISTICS_REPOSITORY.getPaymentsByStatus(matchStage),
    STATISTICS_REPOSITORY.getPaymentsByMethod(matchStage),
    STATISTICS_REPOSITORY.getPaymentCounts(matchStage)
  ])

  const statusMap = {}
  paymentsByStatus.forEach(item => {
    statusMap[item._id] = { count: item.count, totalAmount: Math.round(item.totalAmount) }
  })

  const methodMap = {}
  paymentsByMethod.forEach(item => {
    methodMap[item._id] = {
      count: item.count,
      totalAmount: Math.round(item.totalAmount),
      successCount: item.successCount,
      failedCount: item.failedCount,
      successRate: item.count > 0 ? Math.round((item.successCount / item.count) * 100) : 0
    }
  })

  return {
    period,
    dateRange: { startDate, endDate },
    byStatus: statusMap,
    byMethod: methodMap,
    summary: {
      totalPayments: paymentCounts.total,
      successfulPayments: paymentCounts.successful,
      successRate: paymentCounts.total > 0 ? Math.round((paymentCounts.successful / paymentCounts.total) * 100) : 0
    }
  }
}

/**
 * Inventory Statistics
 * For: Admin, Manager, Staff
 */
const getInventoryStatistics = async (branchId = null) => {
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, null, null)

  // Fetch all data in parallel
  const [stockSummary, lowStockItems, outOfStockItems, stockByBranch] = await Promise.all([
    STATISTICS_REPOSITORY.getInventorySummary(matchStage),
    STATISTICS_REPOSITORY.getLowStockItems(matchStage, 20),
    STATISTICS_REPOSITORY.getOutOfStockItems(matchStage),
    STATISTICS_REPOSITORY.getStockByBranch(matchStage)
  ])

  const summary = stockSummary[0] || { uniqueProducts: 0, totalQuantity: 0, totalValue: 0 }

  return {
    summary: {
      uniqueProducts: summary.uniqueProducts,
      totalQuantity: summary.totalQuantity,
      totalValue: Math.round(summary.totalValue)
    },
    lowStockItems,
    outOfStockItems,
    stockByBranch: stockByBranch.map(s => ({
      ...s,
      totalValue: Math.round(s.totalValue)
    }))
  }
}

/**
 * Compare Statistics between two periods
 * For: Admin, Manager
 */
const getComparisonStatistics = async (branchId = null, currentPeriod = 'this_month', previousPeriod = 'last_month') => {
  // Fetch both periods in parallel
  const [currentStats, previousStats] = await Promise.all([
    getDashboardOverview(branchId, currentPeriod),
    getDashboardOverview(branchId, previousPeriod)
  ])

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    currentPeriod: {
      period: currentPeriod,
      ...currentStats
    },
    previousPeriod: {
      period: previousPeriod,
      ...previousStats
    },
    comparison: {
      ordersChange: calculateChange(currentStats.orders.total, previousStats.orders.total),
      revenueChange: calculateChange(currentStats.revenue.total, previousStats.revenue.total),
      productsSoldChange: calculateChange(currentStats.products.totalSold, previousStats.products.totalSold),
      newCustomersChange: calculateChange(currentStats.customers.newCustomers, previousStats.customers.newCustomers)
    }
  }
}

/**
 * Get Recent/Pinned Orders for Dashboard
 * For: Admin, Manager
 */
const getRecentOrdersForDashboard = async (branchId = null, period = 'this_month', limit = 10, page = 1, customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, startDate, endDate)

  // Get total count
  const totalCount = await orderModel.countDocuments(matchStage)

  // Get paginated orders
  const skip = (page - 1) * limit
  const recentOrders = await orderModel
    .find(matchStage)
    .populate('user', 'fullname email phone')
    .populate('branch', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('orderNumber user orderStatus totalAmount paymentMethod createdAt branch')
    .lean()

  return {
    period,
    dateRange: { startDate, endDate },
    data: recentOrders.map(order => ({
      orderNumber: order.orderNumber,
      customer: order.user?.fullname || 'N/A',
      email: order.user?.email || '',
      phone: order.user?.phone || '',
      status: order.orderStatus,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      branch: order.branch?.name || 'N/A',
      createdAt: order.createdAt
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  }
}

/**
 * Get Order count by status for Dashboard
 * For: Admin, Manager, Staff
 */
const getOrderStatusSummary = async (branchId = null, period = 'this_month', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd)
  const matchStage = STATISTICS_REPOSITORY.buildMatchStage(branchId, startDate, endDate)

  const ordersByStatus = await STATISTICS_REPOSITORY.getOrdersByStatus(matchStage)

  const totalOrders = ordersByStatus.reduce((sum, item) => sum + item.count, 0)

  return {
    period,
    dateRange: { startDate, endDate },
    statuses: ordersByStatus.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0,
      totalAmount: Math.round(item.totalAmount)
    })),
    summary: {
      total: totalOrders,
      totalRevenue: Math.round(ordersByStatus.reduce((sum, item) => sum + item.totalAmount, 0))
    }
  }
}

export const STATISTICS_SERVICE = {
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
