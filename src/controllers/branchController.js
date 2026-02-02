import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'
import { BRANCH_SERVICE } from '#services/branchService.js'

const getBranchById = async (req, res, next) => {
  try {
    const result = await BRANCH_SERVICE.getBranchById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const getAllBranches = async (req, res, next) => {
  try {
    const result = await BRANCH_SERVICE.getAllBranches(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const createBranch = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await BRANCH_SERVICE.createBranch(req.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const updateBranch = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await BRANCH_SERVICE.updateBranch(req.params.id, req.body, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const assignManager = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await BRANCH_SERVICE.assignManagerToBranch(req.params.id, req.body.manager, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Gán quản lý chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const updateBranchStatus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await BRANCH_SERVICE.updateBranchStatus(req.params.id, req.body.isActive, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật trạng thái chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const removeManager = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await BRANCH_SERVICE.removeManagerFromBranch(req.params.id, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Gỡ quản lý chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const deleteBranch = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await BRANCH_SERVICE.deleteBranch(req.params.id, userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Xóa chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

const getAllManagerForBranch = async (req, res, next) => {
  try {
    const result = await BRANCH_SERVICE.getAllManagerForBranch(req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy danh sách quản lý chi nhánh thành công'
    }))
  } catch (error) { next(error) }
}

export const BRANCH_CONTROLLER = {
  getBranchById,
  getAllBranches,
  createBranch,
  updateBranch,
  assignManager,
  updateBranchStatus,
  removeManager,
  deleteBranch,
  getAllManagerForBranch
}