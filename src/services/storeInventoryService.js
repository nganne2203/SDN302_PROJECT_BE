import { STORE_INVENTORY_REPOSITORY } from '#repositories/storeInventoryRepository.js'
import ApiError from '#utils/ApiError.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { BRANCH_SERVICE } from '#services/branchService.js'

/**
 * Tạo inventory cho chi nhánh
 */
const createStoreInventory = async (branchId, productId, quantity = 0, createdBy = null) => {
  await PRODUCT_SERVICE.getProductById(productId)
  await BRANCH_SERVICE.getBranchById(branchId)
  const existingStoreInventory = await STORE_INVENTORY_REPOSITORY.getStoreInventoryByBranchAndProduct(
    branchId,
    productId
  )

  if (existingStoreInventory) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tồn kho cho sản phẩm này tại chi nhánh đã tồn tại'])
  }

  const storeInventoryData = {
    branch: branchId,
    product: productId,
    quantity,
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
  const filter = { branch: branchId }
  const sortField = sortBy || 'quantity'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STORE_INVENTORY_REPOSITORY.getOutOfStockProducts(filter, { page, limit, sort })
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

export const STORE_INVENTORY_SERVICE = {
  createStoreInventory,
  getStoreInventoryByBranchAndProduct,
  getStoreInventoriesByBranch,
  getOutOfStockProductsAtBranch,
  decreaseStoreInventoryOnSale,
  increaseStoreInventory,
  getStoreInventoriesByProduct
}
