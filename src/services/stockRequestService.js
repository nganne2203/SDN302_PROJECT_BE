import { STOCK_REQUEST_REPOSITORY } from '#repositories/stockRequestRepository.js'
import { INVENTORY_REPOSITORY } from '#repositories/inventoryRepository.js'
import { STORE_INVENTORY_REPOSITORY } from '#repositories/storeInventoryRepository.js'
import { STOCK_REQUEST_STATUS } from '#constants/stockRequestConstant.js'
import ApiError from '#utils/ApiError.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { BRANCH_SERVICE } from '#services/branchService.js'

/**
 * Tạo yêu cầu nhập hàng từ chi nhánh
 */
const createStockRequest = async (branchId, productId, quantity, reason, requesterId) => {
  await BRANCH_SERVICE.getBranchById(branchId)
  await PRODUCT_SERVICE.getProductById(productId)
  const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(productId)
  if (!inventory || inventory.quantity < quantity) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Kho tổng không đủ hàng để cấp cho chi nhánh'])
  }

  const stockRequestData = {
    branch: branchId,
    product: productId,
    quantity,
    reason,
    requester: requesterId,
    status: STOCK_REQUEST_STATUS.PENDING
  }

  return STOCK_REQUEST_REPOSITORY.createStockRequest(stockRequestData)
}

/**
 * Lấy danh sách yêu cầu của chi nhánh
 */
const getStockRequestsByBranch = async (branchId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const filter = {}
  const sortField = sortBy || 'createdAt'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STOCK_REQUEST_REPOSITORY.getStockRequestByBranch(branchId, filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Lấy danh sách yêu cầu chưa xử lý
 */
const getPendingStockRequests = async (query = {}) => {
  const { page, limit, sortBy, sortOrder } = query
  const filter = { status: STOCK_REQUEST_STATUS.PENDING }
  const sortField = sortBy || 'createdAt'
  const sortDirection = sortOrder === 'desc' ? -1 : 1
  const sort = { [sortField]: sortDirection }

  const result = await STOCK_REQUEST_REPOSITORY.getAllStockRequests(filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Lấy tất cả stock requests
 */
const getAllStockRequests = async (query = {}) => {
  const { page, limit, sortBy, sortOrder, status } = query
  const filter = {}
  if (status) {
    filter.status = status
  }
  const sortField = sortBy || 'createdAt'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: sortDirection }

  const result = await STOCK_REQUEST_REPOSITORY.getAllStockRequests(filter, { page, limit, sort })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

/**
 * Phê duyệt yêu cầu nhập hàng
 */
const approveStockRequest = async (requestId, adminId, note = '') => {
  const stockRequest = await STOCK_REQUEST_REPOSITORY.getStockRequestById(requestId)
  if (!stockRequest) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy yêu cầu nhập hàng'])
  }

  if (stockRequest.status !== STOCK_REQUEST_STATUS.PENDING) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Yêu cầu này đã được ${stockRequest.status}`])
  }

  const { branch, product, quantity } = stockRequest

  const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(product)
  if (!inventory || inventory.quantity < quantity) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Kho tổng không còn đủ hàng'])
  }

  await INVENTORY_REPOSITORY.decreaseQuantity(product, quantity)
  await STORE_INVENTORY_REPOSITORY.increaseQuantity(branch, product, quantity)

  const updatedRequest = await STOCK_REQUEST_REPOSITORY.updateStockRequestById(requestId, {
    status: STOCK_REQUEST_STATUS.APPROVED,
    admin: adminId,
    note: note
  })

  return updatedRequest
}

/**
 * Từ chối yêu cầu nhập hàng
 */
const rejectStockRequest = async (requestId, note, adminId) => {
  const stockRequest = await STOCK_REQUEST_REPOSITORY.getStockRequestById(requestId)
  if (!stockRequest) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy yêu cầu nhập hàng'])
  }

  if (stockRequest.status !== STOCK_REQUEST_STATUS.PENDING) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Yêu cầu này đã được ${stockRequest.status}`])
  }

  const updatedRequest = await STOCK_REQUEST_REPOSITORY.updateStockRequestById(requestId, {
    status: STOCK_REQUEST_STATUS.REJECTED,
    admin: adminId,
    note: note
  })

  return updatedRequest
}

/**
 * Lấy chi tiết yêu cầu nhập hàng
 */
const getStockRequestDetail = async (requestId) => {
  const stockRequest = await STOCK_REQUEST_REPOSITORY.getStockRequestById(requestId)
  if (!stockRequest) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy yêu cầu nhập hàng'])
  }
  return stockRequest
}

export const STOCK_REQUEST_SERVICE = {
  createStockRequest,
  getStockRequestsByBranch,
  getPendingStockRequests,
  getAllStockRequests,
  approveStockRequest,
  rejectStockRequest,
  getStockRequestDetail
}
