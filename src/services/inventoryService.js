import { INVENTORY_REPOSITORY } from '#repositories/inventoryRepository.js'
import ApiError from '#utils/ApiError.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'

// ============== INVENTORY MANAGEMENT (KHO TỔNG) ==============

/**
 * Tạo inventory mới cho sản phẩm
 */
const createInventory = async (productId, quantity = 0, location = '', userId) => {
  await PRODUCT_SERVICE.getProductById(productId)
  const existingInventory = await INVENTORY_REPOSITORY.getInventoryByProductId(productId)
  if (existingInventory) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Inventory cho sản phẩm này đã tồn tại'])
  }

  const inventoryData = {
    product: productId,
    quantity,
    location,
    createdBy: userId,
    updatedBy: userId
  }

  return INVENTORY_REPOSITORY.createInventory(inventoryData)
}

const updateInventory = async (inventoryId, data, updatedBy = null) => {
  const inventory = await INVENTORY_REPOSITORY.getInventoryById(inventoryId)
  if (!inventory) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy inventory'])
  }
  const updatedData = {}
  if (data.location && data.location !== inventory.location) {
    updatedData.location = data.location
  }
  if (updatedBy) {
    updatedData.updatedBy = updatedBy
  }
  if (data.quantity !== undefined) {
    updatedData.quantity = data.quantity
  }
  return INVENTORY_REPOSITORY.updateInventory(inventoryId, updatedData)
}

/**
 * Lấy thông tin inventory của 1 sản phẩm
 */
const getInventoryByProductId = async (productId) => {
  const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(productId)
  if (!inventory) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy inventory cho sản phẩm này'])
  }
  return inventory
}

/**
 * Lấy danh sách tất cả inventory
 */
const getAllInventories = async (query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const filter = {}
  const sortField = sortBy || 'createdAt'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await INVENTORY_REPOSITORY.getAllInventories(filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Lấy danh sách sản phẩm sắp hết hàng
 */
const getLowStockProducts = async (query = {}) => {
  const { page, limit, threshold = 10, sortBy, sortOrder } = query
  const filter = {}
  const sortField = sortBy || 'quantity'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await INVENTORY_REPOSITORY.getLowStockProducts(threshold, filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Kiểm tra đủ tồn kho
 */
const checkStockAvailability = async (items) => {
  for (const item of items) {
    const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(item.product)
    if (!inventory || inventory.quantity < item.quantity) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Không đủ tồn kho cho sản phẩm: ${item.product}`])
    }
  }
  return true
}

/**
 * Giảm tồn kho khi tạo đơn hàng
 */
const decreaseInventoryOnOrderCreation = async (items) => {
  await checkStockAvailability(items)

  for (const item of items) {
    const updatedInventory = await INVENTORY_REPOSITORY.decreaseQuantity(item.product, item.quantity)
    if (!updatedInventory) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Không thể giảm tồn kho cho sản phẩm: ${item.product}`])
    }
  }

  return true
}

/**
 * Tăng lại tồn kho khi hủy đơn hàng
 */
const restoreInventoryOnOrderCancellation = async (items) => {
  for (const item of items) {
    await INVENTORY_REPOSITORY.increaseQuantity(item.product, item.quantity)
  }
  return true
}

/**
 * Điều chỉnh tồn kho
 */
const adjustInventoryQuantity = async (productId, newQuantity, userId) => {
  const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(productId)
  if (!inventory) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy inventory'])
  }

  const data = {
    quantity: newQuantity,
    updatedBy: userId
  }

  return INVENTORY_REPOSITORY.updateInventory(inventory._id, data)
}

export const INVENTORY_SERVICE = {
  createInventory,
  getInventoryByProductId,
  getAllInventories,
  getLowStockProducts,
  checkStockAvailability,
  decreaseInventoryOnOrderCreation,
  restoreInventoryOnOrderCancellation,
  adjustInventoryQuantity,
  updateInventory
}

