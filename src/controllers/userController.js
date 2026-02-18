import { USER_SERVICE } from '#services/userService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const getAllUsers = async (req, res, next) => {
  try {
    const result = await USER_SERVICE.getAllUsers(req.validated.query)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const getAllStaffForAdmin = async (req, res, next) => {
  try {
    const result = await USER_SERVICE.getAllStaffForAdmin(req.validated.query)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách nhân sự thành công'
    }))
  } catch (error) { next(error) }
}

const getUserById = async (req, res, next) => {
  try {
    const result = await USER_SERVICE.getUserById(req.params.id)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const createUser = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await USER_SERVICE.createUser(req.body, userId)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tạo người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    const updaterId = req.user.id
    const result = await USER_SERVICE.updateUser(userId, req.body, updaterId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id
    const updaterId = req.user.id
    const result = await USER_SERVICE.updateUserStatus(userId, req.body.isActive, updaterId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật trạng thái người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    await USER_SERVICE.deleteUser(userId)
    res.status(StatusCodes.OK).json(responseSuccess({
      message: 'Xóa người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await USER_SERVICE.updateCurrentUser(userId, req.body)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Cập nhật thông tin người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const getAllUsersForManager = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await USER_SERVICE.getAllUsersForManager(userId, req.validated.query)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const getAllCustomersForStaff = async (req, res, next) => {
  try {
    const staffId = req.user.id
    const result = await USER_SERVICE.getAllCustomersForStaff(staffId, req.validated.query)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy danh sách khách hàng thành công'
    }))
  } catch (error) { next(error) }
}

const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await USER_SERVICE.getCurrentUser(userId)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin người dùng thành công'
    }))
  } catch (error) { next(error) }
}

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await USER_SERVICE.changePassword(userId, req.body)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: result.message || 'Đổi mật khẩu thành công'
    }))
  } catch (error) { next(error) }
}

const resetPassword = async (req, res, next) => {
  try {
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    }
    const result = await USER_SERVICE.resetPassword(req.body, requestInfo)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: result.message || 'Đặt lại mật khẩu thành công'
    }))
  } catch (error) { next(error) }
}

const setPassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { password } = req.body

    const result = await USER_SERVICE.setPassword(userId, { password })

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    next(error)
  }
}

const confirmResetPassword = async (req, res, next) => {
  try {
    const result = await USER_SERVICE.confirmPasswordReset(req.body)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: result.message || 'Xác nhận đặt lại mật khẩu thành công'
    }))
  } catch (error) { next(error) }
}

export const USER_CONTROLLER = {
  getAllUsers,
  getAllStaffForAdmin,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateCurrentUser,
  getAllUsersForManager,
  getAllCustomersForStaff,
  getCurrentUser,
  changePassword,
  resetPassword,
  confirmResetPassword,
  setPassword
}