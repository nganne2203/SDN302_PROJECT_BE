import { BRANCH_REPOSITORY } from '#repositories/branchRepository.js'
import { escapeRegex } from '#utils/formatterUtil.js'
import { mapMongoosePagination } from '#utils/pagination.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { RoleEnum } from '#constants/roleConstant.js'

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
  const { manager } = data
  if (manager) {
    await assertValidManager(manager)
    const existingBranch = await BRANCH_REPOSITORY.getAllBranches({ manager })
    if (existingBranch.totalDocs > 0) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người dùng này đã là quản lý của một chi nhánh khác'])
    }
  }

  await assertBranchNameUnique(data.name)
  const branch = await BRANCH_REPOSITORY.createBranch({ ...data, createdBy })

  if (manager) {
    await USER_REPOSITORY.updateUserById(manager, { branch: branch._id })
  }
  return branch
}

const updateBranch = async (branchId, data, updatedBy = null) => {
  const branch = await getBranchById(branchId)

  const { name, address, manager } = data
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
    }
    updatedBranchData.manager = manager
  }
  if (address && address !== branch.address) {
    updatedBranchData.address = address
  }

  return BRANCH_REPOSITORY.updateBranchById(branchId, { ...updatedBranchData, updatedBy })
}

const assignManagerToBranch = async (branchId, managerId, updatedBy = null) => {
  const branch = await getBranchById(branchId)
  await assertValidManager(managerId)
  if (branch.manager && branch.manager.toString() === managerId.toString()) {
    return branch
  }
  const existingBranch = await BRANCH_REPOSITORY.getAllBranches({ manager: managerId })
  if (existingBranch.totalDocs > 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Người dùng này đã là quản lý của một chi nhánh khác'])
  }
  if (branch.manager) {
    await USER_REPOSITORY.updateUserById(branch.manager, { branch: null })
  }
  await USER_REPOSITORY.updateUserById(managerId, { branch: branchId })
  return BRANCH_REPOSITORY.updateBranchById(branchId, { manager: managerId, updatedBy })
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
  }
  return BRANCH_REPOSITORY.updateBranchById(branchId, { manager: null, updatedBy })
}

const deleteBranch = async (branchId) => {
  const branch = await getBranchById(branchId)
  if (branch.manager) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể xóa chi nhánh đang có quản lý. Vui lòng gỡ quản lý trước khi xóa'])
  }
  if (branch.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không thể xóa chi nhánh đang hoạt động. Vui lòng vô hiệu hóa trước khi xóa'])
  }
  return BRANCH_REPOSITORY.deleteBranchById(branchId)
}

export const BRANCH_SERVICE = {
  getBranchById,
  getAllBranches,
  createBranch,
  updateBranch,
  assignManagerToBranch,
  updateBranchStatus,
  removeManagerFromBranch,
  deleteBranch
}