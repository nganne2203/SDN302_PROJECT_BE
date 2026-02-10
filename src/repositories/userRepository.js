import { userModel } from '#models/userModel.js'

const getUserByEmail = async (email, options = {}) => {
  const { includePassword = false, isDeleted = false } = options
  const projection = includePassword ? '+password' : '-password'
  return await userModel.findOne({ email, isDeleted }).select(projection)
}

const getUserByGoogleId = async (googleId) => {
  return await userModel.findOne({ googleId, isDeleted: false }).select('-password')
}

const getUserById = async (id, options = {}) => {
  const { includePassword = false, isDeleted = false } = options
  const projection = includePassword ? '+password' : '-password'
  return await userModel.findOne({ _id: id, isDeleted }).select(projection)
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
  return await userModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
}

const getAllUsers = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  return await userModel.paginate({ ...filter, isDeleted }, {
    page,
    limit,
    sort,
    select: '-password'
  })
}

const getAllUsersForManager = async (managerBranchId, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  const combinedFilter = {
    ...filter,
    branch: managerBranchId,
    isDeleted
  }
  return await userModel.paginate(combinedFilter, {
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

const getUserByBranch = async (branchId, role) => {
  return await userModel.findOne({ branch: branchId, role, isDeleted: false }).select('-password')
}

const getAllUsersWithoutPagination = async (filter = {}, sort = { createdAt: -1 }) => {
  return await userModel.find({ ...filter, isDeleted: false }).sort(sort).select('-password')
}

export const USER_REPOSITORY = {
  createUser,
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
  updateStatusById,
  updateUserById,
  deleteUserById,
  getAllUsers,
  getAllUsersForManager,
  updateEmailVerificationStatusById,
  getUserByBranch,
  getAllUsersWithoutPagination
}
