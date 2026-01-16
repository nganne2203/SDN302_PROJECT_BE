import { userModel } from '#models/userModel.js'

const getUserByEmail = async (email, options = {}) => {
  const { includePassword = false } = options
  const projection = includePassword ? '+password' : '-password'
  return await userModel.findOne({ email }).select(projection)
}

const getUserById = async (id, options = {}) => {
  const { includePassword = false } = options
  const projection = includePassword ? '+password' : '-password'
  return await userModel.findById(id).select(projection)
}

const createUser = async (data) => {
  return await userModel.create(data)
}

const updateUserById = async (id, data) => {
  return await userModel.findByIdAndUpdate(id, data, { new: true, runValidators: true, timestamps: true }).select('-password')
}

const updateStatusById = async (id, isActive, updatedBy = null) => {
  return await userModel.findByIdAndUpdate(
    id,
    { isActive, updatedBy },
    { new: true, runValidators: true, timestamps: true }
  ).select('-password')
}

const deleteUserById = async (id) => {
  return await userModel.findByIdAndDelete(id)
}

const getAllUsers = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  return await userModel.paginate(filter, {
    page,
    limit,
    sort,
    select: '-password'
  })
}

const updateEmailVerificationStatusById = async (id, isEmailVerified, updatedBy = null) => {
  return await userModel.findByIdAndUpdate(
    id,
    { isEmailVerified, updatedBy },
    { new: true, runValidators: true, timestamps: true }
  ).select('-password')
}

export const USER_REPOSITORY = {
  createUser,
  getUserByEmail,
  getUserById,
  updateStatusById,
  updateUserById,
  deleteUserById,
  getAllUsers,
  updateEmailVerificationStatusById
}
