import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { REFRESHTOKEN_REPOSITORY } from '#repositories/refreshTokenRepository.js'

const getBranchById = async (branchId) => {
  const branch = await BRANCH_REPOSITORY.getBranchById(branchId)
  if (!branch) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Chi nhánh không tồn tại'])
  return branch
}

const getAllBranches = async (query = {}) => {
  const { page, limit, search, isActive, sortBy, sortOrder } = query
  const filter = {}
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { address: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await BRANCH_REPOSITORY.getAllBranches(filter, {
    page,
    limit,
    sort
  })
  return {
    data: result.docs,
    pagination: mapMongoosePagination(result)
  }
}

const getAllBranchesWithoutPagination = async (query = {}) => {
  const { search, isActive, sortBy, sortOrder } = query
  const filter = {}
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { address: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  return await BRANCH_REPOSITORY.getAllBranchesWithoutPagination(filter, sort)
}

const assertBranchNameUnique = async (name) => {
  const existingBranch = await BRANCH_REPOSITORY.getBranchByName(name)
  if (existingBranch) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Tên chi nhánh đã được sử dụng'])
  }
}

const assertValidManager = async (managerId) => {
  const user = await USER_REPOSITORY.getUserById(managerId)
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }
  if (user.role !== RoleEnum.MANAGER) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Chỉ người dùng có vai trò Manager mới được gán quản lý chi nhánh'
    ])
  }
  return user
}

const createBranch = async (data, createdBy = null) => {
  let { manager } = data
  manager = manager || null

  if (manager) {
    await assertValidManager(manager)
    const existingBranch = await BRANCH_REPOSITORY.getAllBranches({ manager })
    if (existingBranch.totalDocs > 0) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người dùng này đã là quản lý của một chi nhánh khác'])
    }
  }

  await assertBranchNameUnique(data.name)
  const branch = await BRANCH_REPOSITORY.createBranch({ ...data, manager, createdBy })

  if (manager) {
    await USER_REPOSITORY.updateUserById(manager, { branch: branch._id })
    // Revoke all tokens to force re-login with updated branch info
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(manager)
  }
  return branch
}

const updateBranch = async (branchId, data, updatedBy = null) => {
  const branch = await getBranchById(branchId)

  let { name, address, manager } = data
  manager = manager || null

  const updatedBranchData = {}

  if (name && name !== branch.name) {
    await assertBranchNameUnique(name)
    updatedBranchData.name = name
  }
  if (manager && manager.toString() !== branch.manager?.toString()) {
    await assertValidManager(manager)
    const existingBranch = await BRANCH_REPOSITORY.getAllBranches({ manager })
    if (existingBranch.totalDocs > 0) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người dùng này đã là quản lý của một chi nhánh khác'])
    }
    if (branch.manager) {
      await USER_REPOSITORY.updateUserById(branch.manager, { branch: null })
      // Revoke tokens for old manager
      await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(branch.manager)
    }
    updatedBranchData.manager = manager
    // Revoke tokens for new manager
    await USER_REPOSITORY.updateUserById(manager, { branch: branch._id })
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(manager)
  } else if (manager === null && branch.manager) {
    if (branch.manager) {
      await USER_REPOSITORY.updateUserById(branch.manager, { branch: null })
      // Revoke tokens when manager is removed
      await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(branch.manager)
    }
    updatedBranchData.manager = null
  }
  if (address && address !== branch.address) {
    updatedBranchData.address = address
  }

  return BRANCH_REPOSITORY.updateBranchById(branchId, { ...updatedBranchData, updatedBy })
}

const assignManagerToBranch = async (branchId, manager, updatedBy = null) => {
  const branch = await getBranchById(branchId)
  await assertValidManager(manager)
  if (branch.manager && branch.manager.toString() === manager.toString()) {
    return branch
  }
  const existingBranch = await BRANCH_REPOSITORY.getAllBranches({ manager })
  if (existingBranch.totalDocs > 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người dùng này đã là quản lý của một chi nhánh khác'])
  }
  if (branch.manager) {
    await USER_REPOSITORY.updateUserById(branch.manager, { branch: null })
    // Revoke tokens for old manager
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(branch.manager)
  }
  await USER_REPOSITORY.updateUserById(manager, { branch: branchId })
  // Revoke tokens for new manager to force re-login with updated branch info
  await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(manager)
  return BRANCH_REPOSITORY.updateBranchById(branchId, { manager, updatedBy })
}

const updateBranchStatus = async (branchId, isActive, updatedBy = null) => {
  await getBranchById(branchId)
  if (typeof isActive !== 'boolean') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái không hợp lệ'])
  }
  return BRANCH_REPOSITORY.updateBranchById(branchId, { isActive, updatedBy })
}

const removeManagerFromBranch = async (branchId, updatedBy = null) => {
  const branch = await getBranchById(branchId)
  if (branch.manager) {
    await USER_REPOSITORY.updateUserById(branch.manager, { branch: null })
    // Revoke tokens when manager is removed from branch
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(branch.manager)
  }
  return BRANCH_REPOSITORY.updateBranchById(branchId, { manager: null, updatedBy })
}

const deleteBranch = async (branchId, updatedBy = null) => {
  const branch = await getBranchById(branchId)
  if (branch.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ có thể xóa chi nhánh không hoạt động'])
  }
  if (branch.manager) {
    await USER_REPOSITORY.updateUserById(branch.manager, { branch: null })
    // Revoke tokens when branch is deleted
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(branch.manager)
  }
  return BRANCH_REPOSITORY.updateBranchById(branchId, { isDeleted: true, updatedBy })
}

const getAllManagerForBranch = async (query = {}) => {
  const { search, sortBy, sortOrder } = query
  const filter = { role: RoleEnum.MANAGER }
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } }
    ]
  }
  const sort = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }

  const result = await USER_REPOSITORY.getAllUsersWithoutPagination(filter, sort)
  return {
    data: result
  }
}

export const BRANCH_SERVICE = {
  getBranchById,
  getAllBranches,
  getAllBranchesWithoutPagination,
  createBranch,
  updateBranch,
  assignManagerToBranch,
  updateBranchStatus,
  removeManagerFromBranch,
  deleteBranch,
  getAllManagerForBranch
}