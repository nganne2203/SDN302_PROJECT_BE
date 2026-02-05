import { storeInventoryModel } from '#models/storeInventoryModel.js'

/**
 * Store Inventory Repository
 *
 * Purpose:
 * - Store Inventory is managed by branch managers
 * - Each branch has its own inventory for products
 * - Branch managers can request stock from the main inventory (admin-managed) via stock requests
 * - Each store inventory item has minThreshold and maxThreshold for automatic restock alerts
 *
 * Main Inventory vs Store Inventory:
 * - Main Inventory (inventoryModel): Central warehouse managed by admin
 * - Store Inventory (storeInventoryModel): Branch-specific stock managed by branch managers
 */

const getStoreInventoryByBranchAndProduct = async (branchId, productId) => {
  return storeInventoryModel.findOne({ branch: branchId, product: productId, isDeleted: false }).populate(['branch', 'product'])
}
const getAllStoreInventories = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  return storeInventoryModel.paginate({ ...filter, isDeleted: false }, queryOptions)
}

const getAllStoreInventoriesByBranch = async (branchId, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  const branchFilter = { ...filter, branch: branchId, isDeleted: false }
  return storeInventoryModel.paginate(branchFilter, queryOptions)
}

const createStoreInventory = async (data) => {
  return storeInventoryModel.create(data)
}

const updateStoreInventory = async (inventoryId, data) => {
  return storeInventoryModel.findByIdAndUpdate(inventoryId, data, { new: true, runValidators: true, timestamps: true })
}

const updateQuantity = async (branchId, productId, quantityChange, updatedBy = null) => {
  return storeInventoryModel.findOneAndUpdate(
    { branch: branchId, product: productId, isDeleted: false },
    { $set: { quantity: quantityChange, updatedBy: updatedBy } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const decreaseQuantity = async (branchId, productId, quantity) => {
  return storeInventoryModel.findOneAndUpdate(
    { branch: branchId, product: productId, quantity: { $gte: quantity }, isDeleted: false },
    { $inc: { quantity: -quantity } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const increaseQuantity = async (branchId, productId, quantity) => {
  return storeInventoryModel.findOneAndUpdate(
    { branch: branchId, product: productId, isDeleted: false },
    { $inc: { quantity: quantity } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const getOutOfStockProducts = async (branchId, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  const outOfStockFilter = branchId
    ? { ...filter, branch: branchId, quantity: { $lte: 0 }, isDeleted: false }
    : { ...filter, quantity: { $lte: 0 }, isDeleted: false }
  return storeInventoryModel.paginate(outOfStockFilter, queryOptions)
}

const checkStoreInventoryExists = async (branchId, productId) => {
  return storeInventoryModel.findOne({ branch: branchId, product: productId, isDeleted: false })
}

const getLowStockProductsAtBranch = async (branchId, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  const filter = {
    branch: branchId,
    $expr: { $lt: ['$quantity', '$minThreshold'] },
    isDeleted: false
  }
  return storeInventoryModel.paginate(filter, queryOptions)
}

const getStoreInventoriesByProduct = async (productId) => {
  return storeInventoryModel.find({ product: productId, isDeleted: false }).populate(['branch', 'product'])
}

const getStoreInventoryInfo = async (productId) => {
  const stockInfo = await storeInventoryModel.aggregate([
    { $match: { product: productId, isDeleted: false } },
    { $group: { _id: null, totalStock: { $sum: '$quantity' } } }
  ])
  return stockInfo
}

const stockBranch = async (productId) => {
  const stockBranch = await storeInventoryModel.find({ product: productId, isDeleted: false })
    .populate('branch', 'name address')
    .select('branch quantity minThreshold maxThreshold')

  return stockBranch
}

const getNeedRestockProducts = async (branchId, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  // Products that are below minThreshold and need restocking
  const filter = {
    branch: branchId,
    $expr: { $lt: ['$quantity', '$minThreshold'] },
    isDeleted: false
  }
  return storeInventoryModel.paginate(filter, queryOptions)
}

const getOverstockProducts = async (branchId, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  // Products that exceed maxThreshold
  const filter = {
    branch: branchId,
    $expr: { $gt: ['$quantity', '$maxThreshold'] },
    isDeleted: false
  }
  return storeInventoryModel.paginate(filter, queryOptions)
}

const updateThresholds = async (branchId, productId, minThreshold, maxThreshold, updatedBy = null) => {
  const updateData = { updatedBy }
  if (minThreshold !== undefined) updateData.minThreshold = minThreshold
  if (maxThreshold !== undefined) updateData.maxThreshold = maxThreshold

  return storeInventoryModel.findOneAndUpdate(
    { branch: branchId, product: productId, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true, timestamps: true }
  )
}

const deleteStoreInventory = async (inventoryId, updatedBy = null) => {
  return storeInventoryModel.findByIdAndUpdate(
    inventoryId,
    { isDeleted: true, updatedBy },
    { new: true, timestamps: true }
  )
}

export const STORE_INVENTORY_REPOSITORY = {
  getStoreInventoryByBranchAndProduct,
  getAllStoreInventories,
  getAllStoreInventoriesByBranch,
  createStoreInventory,
  updateStoreInventory,
  updateQuantity,
  decreaseQuantity,
  increaseQuantity,
  getOutOfStockProducts,
  checkStoreInventoryExists,
  getLowStockProductsAtBranch,
  getStoreInventoriesByProduct,
  getStoreInventoryInfo,
  stockBranch,
  getNeedRestockProducts,
  getOverstockProducts,
  updateThresholds,
  deleteStoreInventory
}