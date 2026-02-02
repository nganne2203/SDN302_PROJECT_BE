import { pricingModel } from '#models/pricingModel.js'

const getPricingRulesForProduct = async (productId, quantity) => {
  return await pricingModel
    .find({
      product: productId,
      isActive: true,
      $or: [
        { minQuantity: { $lte: quantity }, maxQuantity: { $gte: quantity } },
        { minQuantity: { $lte: quantity }, maxQuantity: null }
      ]
    })
    .sort({ minQuantity: -1 })
    .limit(1)
}

const getPricingByProduct = async (productId) => {
  return await pricingModel
    .find({ product: productId, isActive: true })
    .sort({ minQuantity: 1 })
}

const getAllPricingByProduct = async (productId) => {
  return await pricingModel
    .find({ product: productId })
    .populate('product', 'name sku basePrice')
    .populate('createdBy', 'fullname email')
    .populate('updatedBy', 'fullname email')
    .sort({ minQuantity: 1 })
}

const getPricingById = async (pricingId) => {
  return await pricingModel
    .findById(pricingId)
    .populate('product', 'name sku basePrice')
    .populate('createdBy', 'fullname email')
    .populate('updatedBy', 'fullname email')
}

const createPricing = async (pricingData) => {
  return await pricingModel.create(pricingData)
}

const createManyPricings = async (pricingsData) => {
  return await pricingModel.insertMany(pricingsData)
}

const updatePricing = async (pricingId, updateData) => {
  return await pricingModel.findByIdAndUpdate(pricingId, updateData, { new: true })
}

const deletePricing = async (pricingId) => {
  return await pricingModel.findByIdAndDelete(pricingId)
}

const deleteManyByProduct = async (productId) => {
  return await pricingModel.deleteMany({ product: productId })
}

const findOverlappingPricing = async (productId, minQuantity, maxQuantity, excludeId = null) => {
  const query = {
    product: productId,
    $or: [
      // Overlap case 1: existing range contains new minQuantity
      { minQuantity: { $lte: minQuantity }, maxQuantity: { $gte: minQuantity } },
      // Overlap case 2: existing range contains new maxQuantity
      { minQuantity: { $lte: maxQuantity }, maxQuantity: { $gte: maxQuantity } },
      // Overlap case 3: new range contains existing range
      { minQuantity: { $gte: minQuantity }, maxQuantity: { $lte: maxQuantity } },
      // Overlap case 4: existing unbounded range overlaps
      { minQuantity: { $lte: maxQuantity }, maxQuantity: null }
    ]
  }

  if (excludeId) {
    query._id = { $ne: excludeId }
  }

  return await pricingModel.findOne(query)
}

const getPricingsWithPagination = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options

  return await pricingModel.paginate(filter, {
    page,
    limit,
    sort,
    populate: [
      { path: 'product', select: 'name sku basePrice images' },
      { path: 'createdBy', select: 'fullname email' },
      { path: 'updatedBy', select: 'fullname email' }
    ]
  })
}

const countByProduct = async (productId) => {
  return await pricingModel.countDocuments({ product: productId })
}

export const PRICING_REPOSITORY = {
  getPricingRulesForProduct,
  getPricingByProduct,
  getAllPricingByProduct,
  getPricingById,
  createPricing,
  createManyPricings,
  updatePricing,
  deletePricing,
  deleteManyByProduct,
  findOverlappingPricing,
  getPricingsWithPagination,
  countByProduct
}
