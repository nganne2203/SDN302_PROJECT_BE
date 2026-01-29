import { storeInventoryModel } from '#models/storeInventoryModel.js'

const getStoreInventoryByBranchAndProduct = async (branchId, productId) => {
  return storeInventoryModel.findOne({ branch: branchId, product: productId }).populate(['branch', 'product'])
}
const getAllStoreInventories = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  return storeInventoryModel.paginate(filter, queryOptions)
}

const getAllStoreInventoriesByBranch = async (branchId, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  const branchFilter = { ...filter, branch: branchId }
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
    { branch: branchId, product: productId },
    { quantity: quantityChange, updatedBy: updatedBy },
    { new: true, runValidators: true, timestamps: true }
  )
}

const decreaseQuantity = async (branchId, productId, quantity) => {
  return storeInventoryModel.findOneAndUpdate(
    { branch: branchId, product: productId, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const increaseQuantity = async (branchId, productId, quantity) => {
  return storeInventoryModel.findOneAndUpdate(
    { branch: branchId, product: productId },
    { $inc: { quantity: quantity } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const getOutOfStockProducts = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  const outOfStockFilter = { ...filter, quantity: { $lte: 0 } }
  return storeInventoryModel.paginate(outOfStockFilter, queryOptions)
}

const checkStoreInventoryExists = async (branchId, productId) => {
  return storeInventoryModel.findOne({ branch: branchId, product: productId })
}

const getLowStockProductsAtBranch = async (branchId, threshold, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product']
  }
  const filter = { branch: branchId, quantity: { $lt: threshold } }
  return storeInventoryModel.paginate(filter, queryOptions)
}

const getStoreInventoriesByProduct = async (productId) => {
  return storeInventoryModel.find({ product: productId }).populate(['branch', 'product'])
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
  getStoreInventoriesByProduct
}