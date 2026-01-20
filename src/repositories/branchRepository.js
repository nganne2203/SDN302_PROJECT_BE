import { branchModel } from '#models/branchModel.js'

const createBranch = async (data) => {
  return await branchModel.create(data)
}

const getBranchById = async (id) => {
  return await branchModel.findById(id)
}

const getAllBranches = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
  return await branchModel.paginate(filter, {
    page,
    limit,
    sort
  })
}

const updateBranchById = async (id, data) => {
  return await branchModel.findByIdAndUpdate(id, data, { new: true, runValidators: true, timestamps: true })
}

const deleteBranchById = async (id) => {
  return await branchModel.findByIdAndDelete(id)
}

const getBranchByName = async (name) => {
  return await branchModel.findOne({ name })
}

export const BRANCH_REPOSITORY = {
  createBranch,
  getBranchById,
  getAllBranches,
  updateBranchById,
  deleteBranchById,
  getBranchByName
}
