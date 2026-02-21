import { STORE_INVENTORY_REPOSITORY } from '#repositories/storeInventoryRepository.js'
import ApiError from '#utils/ApiError.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { BRANCH_SERVICE } from '#services/branchService.js'

/**
 * Store Inventory Service
 *
 * Manages branch-level inventory (store inventory) which is separate from main inventory:
 * - Main Inventory: Central warehouse managed by admins (inventoryModel)
 * - Store Inventory: Branch-specific stock managed by branch managers (storeInventoryModel)
 *
 * Branch managers can:
 * - View and manage their branch's inventory
 * - Request stock from main inventory via stock requests
 * - Set min/max thresholds for automatic restock alerts
 * - Monitor low stock and overstock situations
 */

/**
 * Tạo inventory cho chi nhánh
 */
const createStoreInventory = async (branchData, createdBy = null) => {
  const { branchId, productId, quantity = 0, minThreshold = 10, maxThreshold = 100 } = branchData

  await PRODUCT_SERVICE.getProductById(productId)
  await BRANCH_SERVICE.getBranchById(branchId)
  const existingStoreInventory = await STORE_INVENTORY_REPOSITORY.getStoreInventoryByBranchAndProduct(
    branchId,
    productId
  )

  if (existingStoreInventory) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tồn kho cho sản phẩm này tại chi nhánh đã tồn tại'])
  }

  if (minThreshold >= maxThreshold) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Ngưỡng tối thiểu phải nhỏ hơn ngưỡng tối đa'])
  }

  const storeInventoryData = {
    branch: branchId,
    product: productId,
    quantity,
    minThreshold,
    maxThreshold,
    createdBy,
    updatedBy: createdBy
  }

  return STORE_INVENTORY_REPOSITORY.createStoreInventory(storeInventoryData)
}

/**
 * Lấy tồn kho của chi nhánh
 */
const getStoreInventoryByBranchAndProduct = async (branchId, productId) => {
  const storeInventory = await STORE_INVENTORY_REPOSITORY.getStoreInventoryByBranchAndProduct(branchId, productId)
  if (!storeInventory) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy tồn kho tại chi nhánh này'])
  }
  return storeInventory
}

/**
 * Lấy danh sách tồn kho của chi nhánh
 */
const getStoreInventoriesByBranch = async (branchId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const filter = {}
  const sortField = sortBy || 'createdAt'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STORE_INVENTORY_REPOSITORY.getAllStoreInventoriesByBranch(branchId, filter, {
    page,
    limit,
    sort
  })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Lấy sản phẩm hết hàng tại chi nhánh
 */
const getOutOfStockProductsAtBranch = async (branchId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const filter = {}
  const sortField = sortBy || 'quantity'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STORE_INVENTORY_REPOSITORY.getOutOfStockProducts(branchId, filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Giảm tồn kho tại chi nhánh khi bán hàng
 */
const decreaseStoreInventoryOnSale = async (branchId, productId, quantity) => {
  const storeInventory = await STORE_INVENTORY_REPOSITORY.decreaseQuantity(branchId, productId, quantity)
  if (!storeInventory) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không đủ tồn kho tại chi nhánh'])
  }
  return storeInventory
}

/**
 * Tăng tồn kho tại chi nhánh
 */
const increaseStoreInventory = async (branchId, productId, quantity) => {
  return STORE_INVENTORY_REPOSITORY.increaseQuantity(branchId, productId, quantity)
}

const getStoreInventoriesByProduct = async (productId) => {
  await PRODUCT_SERVICE.getProductById(productId)
  return STORE_INVENTORY_REPOSITORY.getStoreInventoriesByProduct(productId)
}

const getStoreInventoryInfo = async (productId) => {
  return STORE_INVENTORY_REPOSITORY.getStoreInventoryInfo(productId)
}

const stockBranch = async (productId) => {
  return STORE_INVENTORY_REPOSITORY.stockBranch(productId)
}

/**
 * Lấy sản phẩm cần bổ sung tồn kho (dưới ngưỡng tối thiểu)
 */
const getNeedRestockProducts = async (branchId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const sortField = sortBy || 'quantity'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STORE_INVENTORY_REPOSITORY.getNeedRestockProducts(branchId, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Lấy sản phẩm tồn kho thấp tại chi nhánh (dưới ngưỡng tối thiểu)
 */
const getLowStockProductsAtBranch = async (branchId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const sortField = sortBy || 'quantity'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STORE_INVENTORY_REPOSITORY.getLowStockProductsAtBranch(branchId, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Lấy sản phẩm tồn kho quá mức (vượt ngưỡng tối đa)
 */
const getOverstockProducts = async (branchId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const sortField = sortBy || 'quantity'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STORE_INVENTORY_REPOSITORY.getOverstockProducts(branchId, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Cập nhật ngưỡng tồn kho
 */
const updateThresholds = async (branchId, productId, thresholdData, updatedBy = null) => {
  const { minThreshold, maxThreshold } = thresholdData

  if (minThreshold !== undefined && maxThreshold !== undefined && minThreshold >= maxThreshold) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Ngưỡng tối thiểu phải nhỏ hơn ngưỡng tối đa'])
  }

  const storeInventory = await STORE_INVENTORY_REPOSITORY.getStoreInventoryByBranchAndProduct(branchId, productId)
  if (!storeInventory) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy tồn kho tại chi nhánh này'])
  }

  // Check if new thresholds are valid
  const currentMin = minThreshold !== undefined ? minThreshold : storeInventory.minThreshold
  const currentMax = maxThreshold !== undefined ? maxThreshold : storeInventory.maxThreshold

  if (currentMin >= currentMax) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Ngưỡng tối thiểu phải nhỏ hơn ngưỡng tối đa'])
  }

  return STORE_INVENTORY_REPOSITORY.updateThresholds(branchId, productId, minThreshold, maxThreshold, updatedBy)
}

/**
 * Xóa tồn kho tại chi nhánh (soft delete)
 */
const deleteStoreInventory = async (inventoryId, updatedBy = null) => {
  const storeInventory = await STORE_INVENTORY_REPOSITORY.updateStoreInventory(inventoryId, {})
  if (!storeInventory) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy tồn kho'])
  }
  return STORE_INVENTORY_REPOSITORY.deleteStoreInventory(inventoryId, updatedBy)
}

export const STORE_INVENTORY_SERVICE = {
  createStoreInventory,
  getStoreInventoryByBranchAndProduct,
  getStoreInventoriesByBranch,
  getOutOfStockProductsAtBranch,
  decreaseStoreInventoryOnSale,
  increaseStoreInventory,
  getStoreInventoriesByProduct,
  getStoreInventoryInfo,
  stockBranch,
  getNeedRestockProducts,
  getLowStockProductsAtBranch,
  getOverstockProducts,
  updateThresholds,
  deleteStoreInventory
}
