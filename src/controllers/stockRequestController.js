import { STOCK_REQUEST_SERVICE } from '#services/stockRequestService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

/**
 * POST /stock-request - Tạo yêu cầu nhập hàng từ chi nhánh
 */
export const createStockRequest = async (req, res, next) => {
  try {
    const { branch, product, quantity, reason } = req.body
    const userId = req.user.id

    const stockRequest = await STOCK_REQUEST_SERVICE.createStockRequest(branch, product, quantity, reason, userId, req.user)
    res.status(StatusCodes.CREATED).json(
      responseSuccess({
        data: stockRequest,
        message: 'Tạo yêu cầu nhập hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /stock-request - Lấy danh sách tất cả yêu cầu
 */
export const getAllStockRequests = async (req, res, next) => {
  try {
    const result = await STOCK_REQUEST_SERVICE.getAllStockRequests(req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách yêu cầu thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /stock-request/pending - Lấy danh sách yêu cầu chưa xử lý
 */
export const getPendingStockRequests = async (req, res, next) => {
  try {
    const result = await STOCK_REQUEST_SERVICE.getPendingStockRequests(req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách yêu cầu chưa xử lý thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /stock-request/branch/:branchId - Lấy danh sách yêu cầu của chi nhánh
 */
export const getStockRequestsByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const result = await STOCK_REQUEST_SERVICE.getStockRequestsByBranch(branchId, req.validated.query, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách yêu cầu của chi nhánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /stock-request/:requestId - Lấy chi tiết yêu cầu nhập hàng
 */
export const getStockRequestDetail = async (req, res, next) => {
  try {
    const { requestId } = req.params
    const stockRequest = await STOCK_REQUEST_SERVICE.getStockRequestDetail(requestId, req.user)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: stockRequest,
        message: 'Lấy chi tiết yêu cầu thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PUT|PATCH /stock-request/:requestId/approve - Phê duyệt yêu cầu nhập hàng
 */
export const approveStockRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params
    const adminId = req.user.id
    const { approvedQuantity, note = '' } = req.body

    const updatedRequest = await STOCK_REQUEST_SERVICE.approveStockRequest(requestId, approvedQuantity, adminId, note)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: updatedRequest,
        message: 'Phê duyệt yêu cầu nhập hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /stock-request/:requestId/reject - Từ chối yêu cầu nhập hàng
 */
export const rejectStockRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params
    const { note = '' } = req.body
    const adminId = req.user.id

    const updatedRequest = await STOCK_REQUEST_SERVICE.rejectStockRequest(requestId, note, adminId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: updatedRequest,
        message: 'Từ chối yêu cầu nhập hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const STOCK_REQUEST_CONTROLLER = {
  createStockRequest,
  getAllStockRequests,
  getPendingStockRequests,
  getStockRequestsByBranch,
  getStockRequestDetail,
  approveStockRequest,
  rejectStockRequest
}
