import { stockRequestModel } from '#models/stockRequestModel.js'

const getStockRequestById = async (requestId) => {
  return stockRequestModel.findById(requestId, { isDeleted: false }).populate(['branch', 'product', 'requester', 'admin'])
}
const getAllStockRequests = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product', 'requester', 'admin']
  }
  return stockRequestModel.paginate({ ...filter, isDeleted: false }, queryOptions)
}
const createStockRequest = async (data) => {
  return stockRequestModel.create(data)
}
const updateStockRequestById = async (requestId, data) => {
  return stockRequestModel.findByIdAndUpdate(requestId, data, { new: true, runValidators: true, timestamps: true }).populate(['branch', 'product', 'requester', 'admin'])
}

const getStockRequestByBranch = async (branchId, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product', 'requester', 'admin']
  }
  const branchFilter = { ...filter, branch: branchId, isDeleted: false }
  return stockRequestModel.paginate(branchFilter, queryOptions)
}

const getStockRequestByStatus = async (status, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: ['branch', 'product', 'requester', 'admin']
  }
  const statusFilter = { ...filter, status, isDeleted: false }
  return stockRequestModel.paginate(statusFilter, queryOptions)
}

const countPendingRequestsByBranch = async (branchId) => {
  return stockRequestModel.countDocuments({ branch: branchId, status: 'pending', isDeleted: false })
}

export const STOCK_REQUEST_REPOSITORY = {
  getStockRequestById,
  getAllStockRequests,
  createStockRequest,
  updateStockRequestById,
  getStockRequestByBranch,
  getStockRequestByStatus,
  countPendingRequestsByBranch
}
