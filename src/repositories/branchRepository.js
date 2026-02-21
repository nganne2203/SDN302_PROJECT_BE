import { branchModel } from '#models/branchModel.js'

const createBranch = async (data) => {
  return await branchModel.create(data)
}

const getBranchById = async (id) => {
  return await branchModel.findById(id, { isDeleted: false })
}

const getAllBranches = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  return await branchModel.paginate({ ...filter, isDeleted }, {
    page,
    limit,
    sort
  })
}

const getAllBranchesWithoutPagination = async (filter = {}, sort = { createdAt: -1 }) => {
  return await branchModel.find({ ...filter, isDeleted: false }).sort(sort)
}

const updateBranchById = async (id, data) => {
  return await branchModel.findByIdAndUpdate(id, data, { new: true, runValidators: true, timestamps: true })
}

const deleteBranchById = async (id) => {
  return await branchModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true, runValidators: true, timestamps: true })
}

const getBranchByName = async (name) => {
  return await branchModel.findOne({ name, isDeleted: false })
}

export const BRANCH_REPOSITORY = {
  createBranch,
  getBranchById,
  getAllBranches,
  getAllBranchesWithoutPagination,
  updateBranchById,
  deleteBranchById,
  getBranchByName
}
