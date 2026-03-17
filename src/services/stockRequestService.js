import { STOCK_REQUEST_REPOSITORY } from '#repositories/stockRequestRepository.js'
import { INVENTORY_REPOSITORY } from '#repositories/inventoryRepository.js'
import { STORE_INVENTORY_REPOSITORY } from '#repositories/storeInventoryRepository.js'
import { STOCK_REQUEST_STATUS } from '#constants/stockRequestConstant.js'
import ApiError from '#utils/ApiError.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { BRANCH_SERVICE } from '#services/branchService.js'
import { RoleEnum } from '#constants/roleConstant.js'
import mongoose from 'mongoose'

const assertManagerBranchAccess = (currentUser, branchId) => {
  if (!currentUser || currentUser.role !== RoleEnum.MANAGER) {
    return
  }

  if (!currentUser.branch || currentUser.branch !== branchId.toString()) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Manager chỉ được thao tác trên chi nhánh của mình'])
  }
}

/**
 * Tạo yêu cầu nhập hàng từ chi nhánh
 */
const createStockRequest = async (branchId, productId, quantity, reason, requesterId, currentUser = null) => {
  assertManagerBranchAccess(currentUser, branchId)

  await BRANCH_SERVICE.getBranchById(branchId)
  await PRODUCT_SERVICE.getProductById(productId)
  // const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(productId)
  // if (!inventory || inventory.quantity < quantity) {
  //   throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Kho tổng không đủ hàng để cấp cho chi nhánh'])
  // }
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
const getStockRequestsByBranch = async (branchId, query = {}, currentUser = null) => {
  assertManagerBranchAccess(currentUser, branchId)

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
  const { page, limit, search, sortBy, sortOrder, status, branchId, productId } = query
  const filter = {}
  if (status) {
    filter.status = status
  }
  if (search) {
    filter.$or = [
      { reason: { $regex: search, $options: 'i' } },
      { note: { $regex: search, $options: 'i' } }
    ]
  }
  if (branchId) {
    filter.branch = branchId
  }
  if (productId) {
    filter.product = productId
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
const approveStockRequest = async (requestId, approvedQuantity, adminId, note = '') => {
  const session = await mongoose.startSession()

  try {
    let updatedRequest = null

    await session.withTransaction(async () => {
      const stockRequest = await STOCK_REQUEST_REPOSITORY.getStockRequestById(requestId, { session })
      if (!stockRequest) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy yêu cầu nhập hàng'])
      }

      if (stockRequest.status !== STOCK_REQUEST_STATUS.PENDING) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Yêu cầu này đã được xử lý trước đó'])
      }

      const { branch, product, quantity } = stockRequest

      const inventory = await INVENTORY_REPOSITORY.getInventoryByProductId(product, { session })
      const availableStock = inventory?.quantity || 0
      if (approvedQuantity > availableStock) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Số lượng duyệt vượt quá tồn kho khả dụng'])
      }

      let status = STOCK_REQUEST_STATUS.REJECTED
      if (approvedQuantity === quantity) {
        status = STOCK_REQUEST_STATUS.APPROVED
      } else if (approvedQuantity > 0) {
        status = STOCK_REQUEST_STATUS.PARTIALLY_APPROVED
      }

      if (approvedQuantity > 0) {
        const decreasedInventory = await INVENTORY_REPOSITORY.decreaseQuantity(product, approvedQuantity, { session })
        if (!decreasedInventory) {
          throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Kho tổng không còn đủ hàng'])
        }

        await STORE_INVENTORY_REPOSITORY.increaseQuantity(branch, product, approvedQuantity, { session })
      }

      updatedRequest = await STOCK_REQUEST_REPOSITORY.updateStockRequestById(requestId, {
        approvedQuantity,
        status,
        admin: adminId,
        note
      }, { session })
    })

    return updatedRequest
  } finally {
    session.endSession()
  }
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
const getStockRequestDetail = async (requestId, currentUser = null) => {
  const stockRequest = await STOCK_REQUEST_REPOSITORY.getStockRequestById(requestId)
  if (!stockRequest) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy yêu cầu nhập hàng'])
  }

  if (currentUser?.role === RoleEnum.MANAGER) {
    const requestBranchId = stockRequest.branch?._id
      ? stockRequest.branch._id.toString()
      : stockRequest.branch?.toString()

    if (!currentUser.branch || currentUser.branch !== requestBranchId) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, ['Manager chỉ được thao tác trên chi nhánh của mình'])
    }
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
