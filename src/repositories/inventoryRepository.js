import { inventoryModel } from '#models/inventoryModel.js'

const getInventoryByProductId = async (productId) => {
  return inventoryModel.findOne({ product: productId, isDeleted: false }).populate('product')
}

const getAllInventories = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, isDeleted = false } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: 'product'
  }
  return inventoryModel.paginate({ ...filter, isDeleted }, queryOptions)
}

const createInventory = async (data) => {
  return inventoryModel.create(data)
}

const updateInventory = async (inventoryId, data) => {
  return inventoryModel.findByIdAndUpdate(inventoryId, data, { new: true, runValidators: true, timestamps: true })
}

const updateQuantity = async (productId, quantityChange) => {
  return inventoryModel.findOneAndUpdate(
    { product: productId },
    { quantity: quantityChange },
    { new: true, runValidators: true, timestamps: true }
  )
}

const decreaseQuantity = async (productId, quantity) => {
  return inventoryModel.findOneAndUpdate(
    { product: productId, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const increaseQuantity = async (productId, quantity) => {
  return inventoryModel.findOneAndUpdate(
    { product: productId },
    { $inc: { quantity: quantity } },
    { new: true, runValidators: true, timestamps: true }
  )
}

const getLowStockProducts = async (threshold, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { quantity: 1 } } = options
  const queryOptions = {
    page,
    limit,
    sort,
    populate: 'product'
  }
  const lowStockFilter = { ...filter, quantity: { $lt: threshold } }
  return inventoryModel.paginate(lowStockFilter, queryOptions)
}

const deleteInventory = async (productId) => {
  return inventoryModel.findOneAndUpdate({ product: productId }, { isDeleted: true }, { new: true, runValidators: true, timestamps: true })
}

const getInventoryByProductIdWithoutPopulate = async (productId) => {
  return inventoryModel.findOne({ product: productId, isDeleted: false })
}

const checkStockExists = async (productId) => {
  return inventoryModel.findOne({ product: productId, isDeleted: false })
}

const getInventoryById = async (inventoryId) => {
  return inventoryModel.findById(inventoryId, { isDeleted: false }).populate('product')
}

export const INVENTORY_REPOSITORY = {
  getInventoryByProductId,
  getInventoryByProductIdWithoutPopulate,
  getAllInventories,
  createInventory,
  updateInventory,
  updateQuantity,
  decreaseQuantity,
  increaseQuantity,
  getLowStockProducts,
  deleteInventory,
  checkStockExists,
  getInventoryById
}