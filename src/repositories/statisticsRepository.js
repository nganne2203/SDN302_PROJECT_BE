import { orderModel } from '#models/orderModel.js'
import { paymentModel } from '#models/paymentModel.js'
import { productModel } from '#models/productModel.js'
import { userModel } from '#models/userModel.js'
import { storeInventoryModel } from '#models/storeInventoryModel.js'
import { branchModel } from '#models/branchModel.js'
import { ORDER_STATUS } from '#constants/orderConstant.js'
import { PAYMENT_STATUS } from '#constants/paymentConstant.js'
import { RoleEnum } from '#constants/roleConstant.js'

/**
 * Build match stage for aggregation queries
 */
const buildMatchStage = (branchId, startDate, endDate, additionalFilters = {}) => {
  const matchStage = { ...additionalFilters }
  if (branchId) {
    matchStage.branch = branchId
  }
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate }
  }
  return matchStage
}

// ==================== ORDER STATISTICS ====================

/**
 * Get order overview statistics (total, revenue, by status)
 */
const getOrderOverviewStats = async (matchStage) => {
  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $in: ['$orderStatus', [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]] },
              '$totalAmount',
              0
            ]
          }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.PENDING] }, 1, 0] }
        },
        confirmedOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.CONFIRMED] }, 1, 0] }
        },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.SHIPPED] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.DELIVERED] }, 1, 0] }
        },
        canceledOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.CANCELLED] }, 1, 0] }
        },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ])
}

/**
 * Get total products sold from orders
 */
const getProductsSoldStats = async (matchStage) => {
  const orderMatchStage = {
    ...matchStage,
    orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
  }
  return await orderModel.aggregate([
    { $match: orderMatchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$items.quantity' }
      }
    }
  ])
}

/**
 * Get orders grouped by status
 */
const getOrdersByStatus = async (matchStage) => {
  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ])
}

/**
 * Get orders grouped by payment method
 */
const getOrdersByPaymentMethod = async (matchStage) => {
  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ])
}

/**
 * Get orders grouped by delivery status
 */
const getOrdersByDeliveryStatus = async (matchStage) => {
  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$delivery.status',
        count: { $sum: 1 }
      }
    }
  ])
}

/**
 * Get recent orders with populated data
 */
const getRecentOrders = async (matchStage, limit = 10) => {
  return await orderModel.find(matchStage)
    .populate('user', 'fullname email')
    .populate('branch', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderNumber user orderStatus totalAmount paymentMethod createdAt branch')
}

// ==================== REVENUE STATISTICS ====================

/**
 * Get revenue grouped by time period
 */
const getRevenueByPeriod = async (matchStage, dateGroupFormat) => {
  const revenueMatchStage = {
    ...matchStage,
    orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
  }
  return await orderModel.aggregate([
    { $match: revenueMatchStage },
    {
      $group: {
        _id: dateGroupFormat,
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ])
}

// ==================== PRODUCT STATISTICS ====================

/**
 * Get top selling products
 */
const getTopSellingProducts = async (matchStage, limit = 10) => {
  const productMatchStage = {
    ...matchStage,
    orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
  }
  return await orderModel.aggregate([
    { $match: productMatchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        name: '$product.name',
        slug: '$product.slug',
        price: '$product.price',
        images: '$product.images',
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1
      }
    }
  ])
}

/**
 * Get top revenue products
 */
const getTopRevenueProducts = async (matchStage, limit = 10) => {
  const productMatchStage = {
    ...matchStage,
    orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
  }
  return await orderModel.aggregate([
    { $match: productMatchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        name: '$product.name',
        slug: '$product.slug',
        price: '$product.price',
        images: '$product.images',
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1
      }
    }
  ])
}

/**
 * Get products statistics by category
 */
const getProductsByCategory = async (matchStage) => {
  const productMatchStage = {
    ...matchStage,
    orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
  }
  return await orderModel.aggregate([
    { $match: productMatchStage },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category._id',
        categoryName: { $first: '$category.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        productCount: { $addToSet: '$items.product' }
      }
    },
    {
      $project: {
        categoryId: '$_id',
        categoryName: 1,
        totalQuantity: 1,
        totalRevenue: 1,
        uniqueProducts: { $size: '$productCount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ])
}

/**
 * Get active products count
 */
const getActiveProductsCount = async () => {
  return await productModel.countDocuments({ isActive: true })
}

// ==================== CUSTOMER STATISTICS ====================

/**
 * Get new customers count
 */
const getNewCustomersCount = async (startDate, endDate) => {
  const matchStage = { role: 'customer' }
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate }
  }
  return await userModel.countDocuments(matchStage)
}

/**
 * Get top customers by order value
 */
const getTopCustomers = async (matchStage, limit = 10) => {
  const customerMatchStage = { ...matchStage, orderStatus: { $ne: ORDER_STATUS.CANCELED } }
  return await orderModel.aggregate([
    { $match: customerMatchStage },
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        fullname: '$user.fullname',
        email: '$user.email',
        phone: '$user.phone',
        totalOrders: 1,
        totalSpent: 1,
        averageOrderValue: 1
      }
    }
  ])
}

/**
 * Get customer types (new vs returning)
 */
const getCustomerTypes = async (matchStage) => {
  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        firstOrderDate: { $min: '$createdAt' }
      }
    },
    {
      $group: {
        _id: null,
        newCustomers: {
          $sum: { $cond: [{ $eq: ['$orderCount', 1] }, 1, 0] }
        },
        returningCustomers: {
          $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
        },
        totalCustomers: { $sum: 1 }
      }
    }
  ])
}

// ==================== BRANCH STATISTICS ====================

/**
 * Get all active branches
 */
const getActiveBranches = async () => {
  return await branchModel.find({ isActive: true }).select('name address')
}

/**
 * Get detailed branch performance statistics including manager and quantities
 */
const getBranchPerformance = async (startDate = null, endDate = null, limit = 10) => {
  const matchStage = {
    orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
  }

  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate }
  }

  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$branch',
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: { $sum: '$items.quantity' } }
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branchInfo'
      }
    },
    { $unwind: '$branchInfo' },
    {
      $lookup: {
        from: 'users',
        let: { branchId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$branch', '$$branchId'] },
                  { $eq: ['$role', RoleEnum.MANAGER] },
                  { $eq: ['$isDeleted', false] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'managerInfo'
      }
    },
    {
      $project: {
        _id: 1,
        branchName: '$branchInfo.name',
        address: '$branchInfo.address',
        manager: { $arrayElemAt: ['$managerInfo.fullname', 0] },
        managerEmail: { $arrayElemAt: ['$managerInfo.email', 0] },
        totalRevenue: 1,
        totalOrders: 1,
        totalQuantity: 1,
        status: '$branchInfo.isActive'
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ])
}

/**
 * Get order stats for a specific branch
 */
const getBranchOrderStats = async (branchId, startDate, endDate) => {
  const matchStage = { branch: branchId }
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate }
  }
  return await orderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $in: ['$orderStatus', [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]] },
              '$totalAmount',
              0
            ]
          }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.DELIVERED] }, 1, 0] }
        },
        canceledOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.CANCELED] }, 1, 0] }
        }
      }
    }
  ])
}

/**
 * Get inventory value for a specific branch
 */
const getBranchInventoryValue = async (branchId) => {
  return await storeInventoryModel.aggregate([
    { $match: { branch: branchId } },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$quantity', '$productInfo.price'] } },
        totalItems: { $sum: '$quantity' }
      }
    }
  ])
}

// ==================== PAYMENT STATISTICS ====================

/**
 * Get payments grouped by status
 */
const getPaymentsByStatus = async (matchStage) => {
  return await paymentModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ])
}

/**
 * Get payments grouped by method
 */
const getPaymentsByMethod = async (matchStage) => {
  return await paymentModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.SUCCESS] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.FAILED] }, 1, 0] }
        }
      }
    }
  ])
}

/**
 * Get total payment counts
 */
const getPaymentCounts = async (matchStage) => {
  const total = await paymentModel.countDocuments(matchStage)
  const successful = await paymentModel.countDocuments({ ...matchStage, status: PAYMENT_STATUS.SUCCESS })
  return { total, successful }
}

// ==================== INVENTORY STATISTICS ====================

/**
 * Get inventory summary
 */
const getInventorySummary = async (matchStage) => {
  return await storeInventoryModel.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: null,
        totalProducts: { $addToSet: '$product' },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$productInfo.price'] } }
      }
    },
    {
      $project: {
        uniqueProducts: { $size: '$totalProducts' },
        totalQuantity: 1,
        totalValue: 1
      }
    }
  ])
}

/**
 * Get low stock items
 */
const getLowStockItems = async (matchStage, limit = 20) => {
  return await storeInventoryModel.aggregate([
    { $match: { ...matchStage, quantity: { $lte: 10, $gt: 0 } } },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'branches',
        localField: 'branch',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: '$branch' },
    {
      $project: {
        productId: '$product._id',
        productName: '$product.name',
        branchId: '$branch._id',
        branchName: '$branch.name',
        quantity: 1
      }
    },
    { $sort: { quantity: 1 } },
    { $limit: limit }
  ])
}

/**
 * Get out of stock items
 */
const getOutOfStockItems = async (matchStage) => {
  return await storeInventoryModel.aggregate([
    { $match: { ...matchStage, quantity: { $eq: 0 } } },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'branches',
        localField: 'branch',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: '$branch' },
    {
      $project: {
        productId: '$product._id',
        productName: '$product.name',
        branchId: '$branch._id',
        branchName: '$branch.name'
      }
    }
  ])
}

/**
 * Get stock by branch
 */
const getStockByBranch = async (matchStage) => {
  return await storeInventoryModel.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: '$branch',
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$productInfo.price'] } },
        productCount: { $addToSet: '$product' }
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: '$branch' },
    {
      $project: {
        branchId: '$_id',
        branchName: '$branch.name',
        totalQuantity: 1,
        totalValue: 1,
        uniqueProducts: { $size: '$productCount' }
      }
    },
    { $sort: { totalValue: -1 } }
  ])
}

/**
 * Get low stock products count (grouped by product)
 */
const getLowStockProductsCount = async () => {
  return await storeInventoryModel.aggregate([
    {
      $group: {
        _id: '$product',
        totalStock: { $sum: '$quantity' }
      }
    },
    {
      $match: { totalStock: { $lte: 10, $gt: 0 } }
    },
    { $count: 'count' }
  ])
}

/**
 * Get out of stock products count (grouped by product)
 */
const getOutOfStockProductsCount = async () => {
  return await storeInventoryModel.aggregate([
    {
      $group: {
        _id: '$product',
        totalStock: { $sum: '$quantity' }
      }
    },
    {
      $match: { totalStock: { $eq: 0 } }
    },
    { $count: 'count' }
  ])
}

export const STATISTICS_REPOSITORY = {
  // Utils
  buildMatchStage,

  // Order
  getOrderOverviewStats,
  getProductsSoldStats,
  getOrdersByStatus,
  getOrdersByPaymentMethod,
  getOrdersByDeliveryStatus,
  getRecentOrders,

  // Revenue
  getRevenueByPeriod,

  // Product
  getTopSellingProducts,
  getTopRevenueProducts,
  getProductsByCategory,
  getActiveProductsCount,

  // Customer
  getNewCustomersCount,
  getTopCustomers,
  getCustomerTypes,

  // Branch
  getActiveBranches,
  getBranchOrderStats,
  getBranchInventoryValue,
  getBranchPerformance,

  // Payment
  getPaymentsByStatus,
  getPaymentsByMethod,
  getPaymentCounts,

  // Inventory
  getInventorySummary,
  getLowStockItems,
  getOutOfStockItems,
  getStockByBranch,
  getLowStockProductsCount,
  getOutOfStockProductsCount
}
