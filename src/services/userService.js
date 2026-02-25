import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { BCRYPT_UTILS } from '#utils/bcryptUtil.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'
import { UPLOAD_SERVICE } from '#services/uploadService.js'
import { CART_SERVICE } from '#services/cartService.js'
import { maskEmail } from '#utils/formatterUtil.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import { VERIFICATION_REPOSITORY } from '#repositories/verificationRepository.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'
import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { USER_PROVIDER } from '#constants/userConstant.js'

const deleteOldAvatarIfNeeded = async (currentAvatarId, newAvatarId) => {
  if (!currentAvatarId || !newAvatarId) return
  if (currentAvatarId === newAvatarId) return

  try {
    await UPLOAD_SERVICE.deleteImage(currentAvatarId)
  } catch {
    throw new ApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, ['Không thể xóa ảnh cũ trên Cloudinary'])
  }
}

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

const getAllStaffForAdmin = async (query = {}) => {
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

  if (role && [RoleEnum.STAFF, RoleEnum.MANAGER].includes(role)) {
    filter.role = role
  } else {
    filter.role = { $in: [RoleEnum.STAFF, RoleEnum.MANAGER] }
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

const getManagerByBranch = async (branchId) => {
  const manager = await USER_REPOSITORY.getUserByBranch(branchId, RoleEnum.MANAGER)
  return manager
}

const validateBranchExists = async (branchId) => {
  if (!branchId) return
  const branchExists = await BRANCH_REPOSITORY.getBranchById(branchId)
  if (!branchExists) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chi nhánh không tồn tại'])
  }
}

const ensureManagerBranchAvailable = async (branchId, excludedUserId = null) => {
  if (!branchId) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chi nhánh là bắt buộc'])
  }

  const existingManager = await getManagerByBranch(branchId)
  if (
    existingManager &&
    existingManager._id.toString() !== excludedUserId?.toString()
  ) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chi nhánh này đã có 1 manager'])
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
  if (isEmailVerified) {
    newUser.emailVerifiedAt = new Date()
  }
  const createdUser = await USER_REPOSITORY.createUser(newUser)

  if (role === RoleEnum.CUSTOMER) {
    await CART_SERVICE.createCart(createdUser._id)
  }

  return await getUserById(createdUser._id)
}

const createUser = async (userData, createdBy = null) => {
  const creator = await getUserById(createdBy)
  const { role } = userData

  if (!canCreateUser(creator, role, userData.branch)) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      ['Bạn không có quyền tạo người dùng với vai trò này']
    )
  }

  if (creator.role === RoleEnum.MANAGER && role === RoleEnum.STAFF) {
    userData.branch = creator.branch
  }

  if ([RoleEnum.STAFF, RoleEnum.MANAGER].includes(role) && !userData.branch) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chi nhánh là bắt buộc'])
  }

  if (role === RoleEnum.CUSTOMER) {
    userData.branch = null
  }

  const { branch } = userData
  await validateBranchExists(branch)

  if (role === RoleEnum.MANAGER) {
    await ensureManagerBranchAvailable(branch)
  }

  return await createUserInternal({
    ...userData,
    isEmailVerified: true,

    createdBy
  })
}

const updateUser = async (userId, updateData, updatedBy = null) => {
  const updater = await getUserById(updatedBy)
  const user = await getUserById(userId)

  if (updater.role === RoleEnum.STAFF) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['STAFF không có quyền cập nhật người dùng'])
  }

  if (updater.role === RoleEnum.MANAGER) {
    if (user.role !== RoleEnum.STAFF) {
      throw new ApiError(
        ERROR_CODES.FORBIDDEN,
        ['MANAGER chỉ có thể cập nhật STAFF trong chi nhánh quản lý']
      )
    }

    if (user.branch?.toString() !== updater.branch?.toString()) {
      throw new ApiError(
        ERROR_CODES.FORBIDDEN,
        ['Không thể cập nhật STAFF ngoài chi nhánh quản lý']
      )
    }
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

  if (role && updater.role === RoleEnum.MANAGER) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      ['MANAGER không được thay đổi vai trò']
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

  if (avatar) {
    await deleteOldAvatarIfNeeded(user.avatar, avatar)
    updatedUserData.avatar = avatar
  }

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

  const targetRole = updatedUserData.role || user.role
  const targetBranch = Object.prototype.hasOwnProperty.call(updatedUserData, 'branch')
    ? updatedUserData.branch
    : user.branch

  if ([RoleEnum.STAFF, RoleEnum.MANAGER].includes(targetRole) && !targetBranch) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chi nhánh là bắt buộc'])
  }

  if (targetRole !== RoleEnum.CUSTOMER && targetBranch) {
    await validateBranchExists(targetBranch)
  }

  if (targetRole === RoleEnum.MANAGER) {
    await ensureManagerBranchAvailable(targetBranch, userId)
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
    updatedUserData.isEmailVerified = false
    updatedUserData.emailVerifiedAt = null
  }
  if (fullname) updatedUserData.fullname = fullname
  if (phone) updatedUserData.phone = phone
  if (addresses) updatedUserData.addresses = addresses
  if (avatar) {
    await deleteOldAvatarIfNeeded(user.avatar, avatar)
    updatedUserData.avatar = avatar
  }

  return USER_REPOSITORY.updateUserById(userId, updatedUserData)
}

const getAllUsersForManager = async (managerId, query = {}) => {
  const manager = await getUserById(managerId)
  const { page, limit, search, isActive, role, sortBy, sortOrder } = query

  if (manager.role !== RoleEnum.MANAGER) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Người dùng không có quyền truy cập'])
  }

  // Base filter: exclude admin accounts
  const filter = { role: { $ne: RoleEnum.ADMIN } }

  // Handle role-based filtering
  if (role) {
    if (role === RoleEnum.ADMIN) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, ['Không thể truy cập thông tin admin'])
    } else if (role === RoleEnum.CUSTOMER) {
      // Customers: no branch filter
      filter.role = RoleEnum.CUSTOMER
    } else if ([RoleEnum.STAFF, RoleEnum.MANAGER].includes(role)) {
      // Staff/Manager: filter by branch
      filter.role = role
      filter.branch = manager.branch
    }
  } else {
    // No role filter: return customers + staff/managers from the manager's branch
    filter.$or = [
      { role: RoleEnum.CUSTOMER },
      { role: { $in: [RoleEnum.STAFF, RoleEnum.MANAGER] }, branch: manager.branch }
    ]
  }

  if (search) {
    const escapedSearch = escapeRegex(search)
    const searchCondition = [
      { fullname: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } }
    ]

    // Combine with existing $or conditions if present
    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: searchCondition }
      ]
      delete filter.$or
    } else {
      filter.$or = searchCondition
    }
  }

  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
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

const getAllCustomersForStaff = async (staffId, query = {}) => {
  const staff = await getUserById(staffId)
  const { page, limit, search, isActive, sortBy, sortOrder } = query

  if (staff.role !== RoleEnum.STAFF) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, ['Người dùng không có quyền truy cập'])
  }

  // Staff can only see customers
  const filter = { role: RoleEnum.CUSTOMER }

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

const getCurrentUser = async (userId) => {
  const user = await USER_REPOSITORY.getUserById(userId)
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }

  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }

  return {
    user
  }
}

const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data
  const user = await USER_REPOSITORY.getUserById(userId, { includePassword: true })
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }
  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }
  if (currentPassword === newPassword) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Mật khẩu mới không được trùng với mật khẩu hiện tại'
    ])
  }

  const isPasswordValid = await BCRYPT_UTILS.comparePassword(currentPassword, user.password)
  if (!isPasswordValid) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Mật khẩu hiện tại không chính xác'
    ])
  }

  const hashedPassword = await BCRYPT_UTILS.hashPassword(newPassword)
  await USER_REPOSITORY.updateUserById(user._id, {
    password: hashedPassword
  })

  await EMAIL_SERVICE.changePasswordNotification(user.email)

  return {
    message: 'Đổi mật khẩu thành công'
  }
}

const setPassword = async (userId, data) => {
  const { password } = data
  const user = await USER_REPOSITORY.getUserById(userId, { includePassword: true })
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }

  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }

  if (user.password) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Bạn đã có mật khẩu. Vui lòng dùng chức năng đổi mật khẩu'
    ])
  }

  if (user.provider === USER_PROVIDER.LOCAL && user.password) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Chỉ người dùng OAuth mới có thể sử dụng chức năng này'
    ])
  }

  const hashedPassword = await BCRYPT_UTILS.hashPassword(password)
  await USER_REPOSITORY.updateUserById(user._id, {
    password: hashedPassword
  })

  await EMAIL_SERVICE.changePasswordNotification(user.email)

  return {
    message: 'Đặt mật khẩu thành công'
  }
}

const resetPassword = async (data, requestInfo = {}) => {
  const { email } = data
  const { ipAddress = '', userAgent = '' } = requestInfo
  const user = await USER_REPOSITORY.getUserByEmail(email)
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Email không tồn tại'])
  if (!user.isActive) throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, ['Tài khoản của bạn đã bị vô hiệu hóa'])
  if (!user.isEmailVerified) throw new ApiError(ERROR_CODES.EMAIL_NOT_VERIFIED, ['Vui lòng xác nhận email trước khi đặt lại mật khẩu'])
  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(user._id, VERIFY_TYPE.RESET_PASSWORD)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    user: user._id,
    type: VERIFY_TYPE.RESET_PASSWORD,
    code,
    expiresAt: GENERATE_UTILS.expiresInMinutes(),
    ipAddress,
    userAgent
  })
  await EMAIL_SERVICE.sendVerificationCode(user.email, code, VERIFY_TYPE.RESET_PASSWORD, GENERATE_UTILS.OTP_EXPIRES_IN_MINUTES)
  return {
    message: `Mã xác thực đặt lại mật khẩu đã được gửi đến email ${maskEmail(email)}`
  }
}

const confirmPasswordReset = async (data) => {
  const { email, password } = data
  const user = await USER_REPOSITORY.getUserByEmail(email)
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }

  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }

  const hashedPassword = await BCRYPT_UTILS.hashPassword(password)
  await USER_REPOSITORY.updateUserById(user._id, {
    password: hashedPassword
  })

  await EMAIL_SERVICE.changePasswordNotification(user.email)

  return {
    message: 'Đặt lại mật khẩu thành công'
  }
}

export const USER_SERVICE = {
  getUserById,
  getAllUsers,
  getAllStaffForAdmin,
  getUserByEmail,
  assertEmailNotExists,
  createUserInternal,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateEmailVerificationStatus,
  updateCurrentUser,
  getAllUsersForManager,
  getAllCustomersForStaff,
  getManagerByBranch,
  getCurrentUser,
  changePassword,
  resetPassword,
  confirmPasswordReset,
  setPassword
}