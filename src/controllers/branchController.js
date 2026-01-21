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

export const BRANCH_CONTROLLER = {
  getBranchById
}