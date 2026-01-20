import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { BCRYPT_UTILS } from '#utils/bcryptUtil.js'
import { RoleEnum } from '#constants/roleConstant.js'

const getUserById = async (userId) => {
  const user = await USER_REPOSITORY.getUserById(userId)
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  return user
}

const getAllUsers = async (query = {}) => {
  const { page, limit, search, isActive, role, sortBy, sortOrder } = query
  const filter = {}

  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { fullname: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }

  if (role) {
    filter.role = role
  }

  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await USER_REPOSITORY.getAllUsers(filter, {
    page,
    limit,
    sort
  })

  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const getUserByEmail = async (email) => {
  const user = await USER_REPOSITORY.getUserByEmail(email)
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  return user
}

const assertEmailNotExists = async (email) => {
  const user = await USER_REPOSITORY.getUserByEmail(email)
  if (user) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Email đã được sử dụng'])
  }
  return user
}

const canCreateUser = (creator, targetRole, targetBranch) => {
  switch (creator.role) {
  case RoleEnum.ADMIN:
    return true

  case RoleEnum.MANAGER:
    if (![RoleEnum.STAFF, RoleEnum.CUSTOMER].includes(targetRole)) {
      return false
    }

    if (targetRole === RoleEnum.CUSTOMER) return true

    return creator.branch?.toString() === targetBranch?.toString()

  case RoleEnum.STAFF:
    return targetRole === RoleEnum.CUSTOMER

  default:
    return false
  }
}

const createUserInternal = async ({
  fullname,
  email,
  password,
  phone,
  branch = null,
  role = RoleEnum.CUSTOMER,
  avatar = null,
  addresses = [],
  createdBy = null,
  isEmailVerified = false
}) => {
  await assertEmailNotExists(email)
  const hashedPassword = await BCRYPT_UTILS.hashPassword(password)
  const newUser = {
    fullname,
    email,
    password: hashedPassword,
    phone,
    branch,
    role,
    avatar,
    addresses,
    createdBy,
    isEmailVerified
  }
  const createdUser = await USER_REPOSITORY.createUser(newUser)
  return await getUserById(createdUser._id)
}

const createUser = async (userData, createdBy = null) => {
  const creator = await getUserById(createdBy)
  const { role } = userData

  if (creator.role === RoleEnum.MANAGER && role === RoleEnum.STAFF) {
    userData.branch = creator.branch
  }

  if (role === RoleEnum.CUSTOMER) {
    userData.branch = null
  }

  if (!canCreateUser(creator, role, userData.branch)) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      ['Bạn không có quyền tạo người dùng với vai trò này']
    )
  }

  return await createUserInternal({
    ...userData,
    createdBy
  })
}

const updateUser = async (userId, updateData, updatedBy = null) => {
  const updater = await getUserById(updatedBy)
  const user = await getUserById(userId)

  if (updater.role === RoleEnum.MANAGER && user.role === RoleEnum.ADMIN) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Không thể cập nhật tài khoản ADMIN'])
  }

  if (
    updater.role === RoleEnum.MANAGER &&
    user.role === RoleEnum.STAFF &&
    user.branch?.toString() !== updater.branch?.toString()
  ) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      ['Không thể cập nhật STAFF ngoài chi nhánh quản lý']
    )
  }

  const {
    fullname,
    email,
    phone,
    addresses,
    avatar,
    role,
    branch
  } = updateData

  if (
    updater.role === RoleEnum.MANAGER &&
    role === RoleEnum.ADMIN
  ) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      ['MANAGER không được gán quyền ADMIN']
    )
  }

  if (email && email !== user.email) {
    await assertEmailNotExists(email)
  }

  const updatedUserData = { updatedBy }

  if (email) {
    updatedUserData.email = email
    updatedUserData.isEmailVerified = false
    updatedUserData.emailVerifiedAt = null
  }

  if (fullname) updatedUserData.fullname = fullname
  if (phone) updatedUserData.phone = phone
  if (addresses) {
    if (!Array.isArray(addresses)) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Addresses phải là mảng'])
    }
    updatedUserData.addresses = addresses
  }

  if (avatar) updatedUserData.avatar = avatar

  if (role) {
    updatedUserData.role = role

    if (role === RoleEnum.CUSTOMER) {
      updatedUserData.branch = null
    }
  }

  if (branch !== undefined) {
    if (user.role === RoleEnum.CUSTOMER || role === RoleEnum.CUSTOMER) {
      updatedUserData.branch = null
    } else {
      if (
        updater.role === RoleEnum.MANAGER &&
        branch?.toString() !== updater.branch?.toString()
      ) {
        throw new ApiError(
          ERROR_CODES.FORBIDDEN,
          ['Không thể gán branch ngoài phạm vi quản lý']
        )
      }
      updatedUserData.branch = branch
    }
  }

  return USER_REPOSITORY.updateUserById(userId, updatedUserData)
}

const updateEmailVerificationStatus = async (id, isEmailVerified, updatedBy = null) => {
  await getUserById(id)
  return await USER_REPOSITORY.updateEmailVerificationStatusById(id, isEmailVerified, updatedBy)
}

const updateUserStatus = async (id, isActive, updatedBy = null) => {
  await getUserById(id)

  return await USER_REPOSITORY.updateStatusById(id, isActive, updatedBy)
}

const deleteUser = async (id) => {
  const user = await getUserById(id)

  if (user.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Không thể xóa người dùng đang hoạt động. Vui lòng vô hiệu hóa trước khi xóa'
    ])
  }

  return await USER_REPOSITORY.deleteUserById(id)
}

const updateCurrentUser = async (userId, updateData) => {
  const user = await getUserById(userId)
  const {
    fullname,
    email,
    phone,
    addresses,
    avatar
  } = updateData

  if (email && email !== user.email) {
    await assertEmailNotExists(email)
  }

  const updatedUserData = { updatedBy: userId }
  if (email) {
    updatedUserData.email = email
    updateData.isEmailVerified = false
    updatedUserData.emailVerifiedAt = null
  }
  if (fullname) updatedUserData.fullname = fullname
  if (phone) updatedUserData.phone = phone
  if (addresses) updatedUserData.addresses = addresses
  if (avatar) updatedUserData.avatar = avatar

  return USER_REPOSITORY.updateUserById(userId, updatedUserData)
}

const getAllUsersForManager = async (managerId, query = {}) => {
  const manager = await getUserById(managerId)
  const { page, limit, search, isActive, role, sortBy, sortOrder } = query

  if (manager.role !== RoleEnum.MANAGER) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Người dùng không có quyền truy cập'])
  }
  const filter = { branch: manager.branch }

  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { fullname: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }
  if (role) {
    filter.role = role
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await USER_REPOSITORY.getAllUsers(filter, {
    page,
    limit,
    sort
  })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

export const USER_SERVICE = {
  getUserById,
  getAllUsers,
  getUserByEmail,
  assertEmailNotExists,
  createUserInternal,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateEmailVerificationStatus,
  updateCurrentUser,
  getAllUsersForManager
}