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

export const USER_CONTROLLER = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateCurrentUser,
  getAllUsersForManager
}