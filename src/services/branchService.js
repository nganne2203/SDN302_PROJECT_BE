import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { REFRESHTOKEN_REPOSITORY } from '#repositories/refreshTokenRepository.js'
import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'

const enrichBranchesWithManagers = async (branches = []) => {
  if (!branches.length) return []

  const branchIds = branches.map(branch => branch._id)
  const managers = await USER_REPOSITORY.getAllUsersWithoutPagination({
    role: RoleEnum.MANAGER,
    branch: { $in: branchIds }
  })

  const managerByBranchId = new Map(
    managers
      .filter(manager => manager.branch)
      .map(manager => [
        manager.branch.toString(),
        {
          id: manager._id,
          name: manager.fullname
        }
      ])
  )

  return branches.map(branch => {
    const branchObj = branch.toObject ? branch.toObject() : branch
    const manager = managerByBranchId.get(branchObj._id.toString()) || null
    return {
      ...branchObj,
      manager
    }
  })
}

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

  const enrichedBranches = await enrichBranchesWithManagers(result.docs)

  return {
    data: enrichedBranches,
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

  const branches = await BRANCH_REPOSITORY.getAllBranchesWithoutPagination(filter, sort)
  return await enrichBranchesWithManagers(branches)
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

const getCurrentManagerByBranch = async (branchId) => {
  return await USER_REPOSITORY.getUserByBranch(branchId, RoleEnum.MANAGER)
}

const createBranch = async (data, createdBy = null) => {
  await assertBranchNameUnique(data.name)
  return await BRANCH_REPOSITORY.createBranch({ ...data, createdBy })
}

const updateBranch = async (branchId, data, updatedBy = null) => {
  const branch = await getBranchById(branchId)

  const { name, address } = data

  const updatedBranchData = {}

  if (name && name !== branch.name) {
    await assertBranchNameUnique(name)
    updatedBranchData.name = name
  }
  if (address && address !== branch.address) {
    updatedBranchData.address = address
  }

  return BRANCH_REPOSITORY.updateBranchById(branchId, { ...updatedBranchData, updatedBy })
}

const assignManagerToBranch = async (branchId, manager, updatedBy = null) => {
  const branch = await getBranchById(branchId)
  const managerUser = await assertValidManager(manager)

  if (managerUser.branch && managerUser.branch.toString() !== branchId.toString()) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người dùng này đã là quản lý của một chi nhánh khác'])
  }

  const currentManager = await getCurrentManagerByBranch(branchId)
  if (currentManager && currentManager._id.toString() === manager.toString()) {
    return branch
  }

  if (currentManager) {
    await USER_REPOSITORY.updateUserById(currentManager._id, { branch: null })
    // Revoke tokens for old manager
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(currentManager._id)
  }

  await USER_REPOSITORY.updateUserById(manager, { branch: branchId })
  // Revoke tokens for new manager to force re-login with updated branch info
  await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(manager)
  return await BRANCH_REPOSITORY.updateBranchById(branchId, { updatedBy })
}

const updateBranchStatus = async (branchId, isActive, updatedBy = null) => {
  await getBranchById(branchId)
  if (typeof isActive !== 'boolean') {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Trạng thái không hợp lệ'])
  }
  return BRANCH_REPOSITORY.updateBranchById(branchId, { isActive, updatedBy })
}

const removeManagerFromBranch = async (branchId, updatedBy = null) => {
  await getBranchById(branchId)
  const currentManager = await getCurrentManagerByBranch(branchId)

  if (currentManager) {
    await USER_REPOSITORY.updateUserById(currentManager._id, { branch: null })
    // Revoke tokens when manager is removed from branch
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(currentManager._id)
  }

  return await BRANCH_REPOSITORY.updateBranchById(branchId, { updatedBy })
}

const deleteBranch = async (branchId, updatedBy = null) => {
  const branch = await getBranchById(branchId)
  if (branch.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Chỉ có thể xóa chi nhánh không hoạt động'])
  }

  if ((await STORE_INVENTORY_SERVICE.getStoreInventoriesByBranch(branchId)).data.length > 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể xóa chi nhánh có tồn kho sản phẩm'])
  }
  const currentManager = await getCurrentManagerByBranch(branchId)
  if (currentManager) {
    await USER_REPOSITORY.updateUserById(currentManager._id, { branch: null })
    // Revoke tokens when branch is deleted
    await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(currentManager._id)
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