import { PRICING_REPOSITORY } from '#repositories/pricingRepository.js'
import { PRODUCT_REPOSITORY } from '#repositories/productRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'

const getAllPricings = async (query = {}) => {
  const { page = 1, limit = 10, productId, isActive } = query

  const filter = {}
  if (productId) {
    filter.product = productId
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true
  }

  const result = await PRICING_REPOSITORY.getPricingsWithPagination(filter, { page, limit })

  return {
    data: result.docs,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.totalDocs,
      totalPages: result.totalPages
    }
  }
}

const getPricingsByProduct = async (productId) => {
  const product = await PRODUCT_REPOSITORY.getProductById(productId)
  if (!product) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy sản phẩm'])
  }

  const pricings = await PRICING_REPOSITORY.getAllPricingByProduct(productId)

  return {
    product: {
      _id: product._id,
      name: product.name,
      sku: product.sku,
      basePrice: product.basePrice
    },
    pricingTiers: pricings
  }
}

const getPricingById = async (pricingId) => {
  const pricing = await PRICING_REPOSITORY.getPricingById(pricingId)

  if (!pricing) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy bảng giá'])
  }

  return pricing
}

const createPricing = async (pricingData, userId) => {
  const { productId, minQuantity, maxQuantity, pricePerUnit, discountPercentage, description } = pricingData

  const product = await PRODUCT_REPOSITORY.getProductById(productId)
  if (!product) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy sản phẩm'])
  }

  if (maxQuantity !== null && maxQuantity !== undefined && minQuantity > maxQuantity) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Số lượng tối thiểu phải nhỏ hơn hoặc bằng số lượng tối đa'])
  }

  const effectiveMaxQuantity = maxQuantity ?? Number.MAX_SAFE_INTEGER
  const overlapping = await PRICING_REPOSITORY.findOverlappingPricing(productId, minQuantity, effectiveMaxQuantity)

  if (overlapping) {
    throw new ApiError(ERROR_CODES.CONFLICT, [
      `Bảng giá trùng lặp với mức giá từ ${overlapping.minQuantity} đến ${overlapping.maxQuantity || 'không giới hạn'}`
    ])
  }

  return await PRICING_REPOSITORY.createPricing({
    product: productId,
    minQuantity,
    maxQuantity: maxQuantity || null,
    pricePerUnit,
    discountPercentage: discountPercentage || 0,
    description: description || '',
    isActive: true,
    createdBy: userId
  })
}

const createBulkPricings = async (productId, tiers, userId) => {
  // Validate product exists
  const product = await PRODUCT_REPOSITORY.getProductById(productId)
  if (!product) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy sản phẩm'])
  }

  // Validate tiers
  if (!tiers || tiers.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Cần ít nhất một mức giá'])
  }

  // Sort tiers by minQuantity
  const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)

  // Validate no overlapping ranges
  for (let i = 0; i < sortedTiers.length - 1; i++) {
    const current = sortedTiers[i]
    const next = sortedTiers[i + 1]

    const currentMax = current.maxQuantity || Number.MAX_SAFE_INTEGER
    if (currentMax >= next.minQuantity) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [
        `Mức giá ${i + 1} và ${i + 2} có khoảng số lượng trùng lặp`
      ])
    }
  }

  // Delete existing pricings for this product (optional: replace all)
  await PRICING_REPOSITORY.deleteManyByProduct(productId)

  // Create new pricings
  const pricingsData = sortedTiers.map((tier) => ({
    product: productId,
    minQuantity: tier.minQuantity,
    maxQuantity: tier.maxQuantity || null,
    pricePerUnit: tier.pricePerUnit,
    discountPercentage: tier.discountPercentage || 0,
    description: tier.description || '',
    isActive: true,
    createdBy: userId
  }))

  await PRICING_REPOSITORY.createManyPricings(pricingsData)

  return await PRICING_REPOSITORY.getAllPricingByProduct(productId)
}

const updatePricing = async (pricingId, updateData, userId) => {
  const pricing = await PRICING_REPOSITORY.getPricingById(pricingId)

  if (!pricing) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy bảng giá'])
  }

  const { minQuantity, maxQuantity, pricePerUnit, discountPercentage, description, isActive } = updateData

  const newMinQuantity = minQuantity !== undefined ? minQuantity : pricing.minQuantity
  const newMaxQuantity = maxQuantity !== undefined ? maxQuantity : pricing.maxQuantity

  if (newMaxQuantity !== null && newMinQuantity > newMaxQuantity) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Số lượng tối thiểu phải nhỏ hơn hoặc bằng số lượng tối đa'])
  }

  if (minQuantity !== undefined || maxQuantity !== undefined) {
    const effectiveMaxQuantity = newMaxQuantity ?? Number.MAX_SAFE_INTEGER
    const overlapping = await PRICING_REPOSITORY.findOverlappingPricing(
      pricing.product._id || pricing.product,
      newMinQuantity,
      effectiveMaxQuantity,
      pricingId
    )

    if (overlapping) {
      throw new ApiError(ERROR_CODES.CONFLICT, [
        `Bảng giá trùng lặp với mức giá từ ${overlapping.minQuantity} đến ${overlapping.maxQuantity || 'không giới hạn'}`
      ])
    }
  }

  const updates = { updatedBy: userId }

  if (minQuantity !== undefined) updates.minQuantity = minQuantity
  if (maxQuantity !== undefined) updates.maxQuantity = maxQuantity
  if (pricePerUnit !== undefined) updates.pricePerUnit = pricePerUnit
  if (discountPercentage !== undefined) updates.discountPercentage = discountPercentage
  if (description !== undefined) updates.description = description
  if (isActive !== undefined) updates.isActive = isActive

  await PRICING_REPOSITORY.updatePricing(pricingId, updates)

  return await PRICING_REPOSITORY.getPricingById(pricingId)
}

const togglePricingStatus = async (pricingId, userId) => {
  const pricing = await PRICING_REPOSITORY.getPricingById(pricingId)

  if (!pricing) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy bảng giá'])
  }

  await PRICING_REPOSITORY.updatePricing(pricingId, {
    isActive: !pricing.isActive,
    updatedBy: userId
  })

  return await PRICING_REPOSITORY.getPricingById(pricingId)
}

/**
 * Delete a pricing rule
 * @param {string} pricingId - Pricing ID
 * @returns {Object} Deleted pricing rule
 */
const deletePricing = async (pricingId) => {
  const pricing = await PRICING_REPOSITORY.getPricingById(pricingId)

  if (!pricing) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy bảng giá'])
  }

  await PRICING_REPOSITORY.deletePricing(pricingId)

  return { message: 'Xóa bảng giá thành công', pricing }
}

/**
 * Delete all pricing rules for a product
 * @param {string} productId - Product ID
 * @returns {Object} Deletion result
 */
const deleteProductPricings = async (productId) => {
  const product = await PRODUCT_REPOSITORY.getProductById(productId)

  if (!product) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy sản phẩm'])
  }

  const count = await PRICING_REPOSITORY.countByProduct(productId)
  await PRICING_REPOSITORY.deleteManyByProduct(productId)

  return { message: `Đã xóa ${count} bảng giá của sản phẩm`, deletedCount: count }
}

/**
 * Calculate price for a product with quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity
 * @returns {Object} Price calculation result
 */
const calculatePrice = async (productId, quantity) => {
  const product = await PRODUCT_REPOSITORY.getProductById(productId)

  if (!product) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Không tìm thấy sản phẩm'])
  }

  const basePrice = product.basePrice
  const baseTotalPrice = basePrice * quantity

  // Get applicable pricing rule
  const pricingRules = await PRICING_REPOSITORY.getPricingRulesForProduct(productId, quantity)

  if (pricingRules && pricingRules.length > 0) {
    const rule = pricingRules[0]
    const discountedPrice = rule.pricePerUnit
    const discountPercentage = rule.discountPercentage || ((basePrice - discountedPrice) / basePrice) * 100
    const totalPrice = discountedPrice * quantity
    const savings = baseTotalPrice - totalPrice

    return {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        basePrice
      },
      quantity,
      pricing: {
        pricePerUnit: discountedPrice,
        totalPrice,
        originalTotal: baseTotalPrice,
        savings,
        discountPercentage: Math.round(discountPercentage * 100) / 100,
        appliedRule: {
          minQuantity: rule.minQuantity,
          maxQuantity: rule.maxQuantity,
          description: rule.description
        }
      }
    }
  }

  return {
    product: {
      _id: product._id,
      name: product.name,
      sku: product.sku,
      basePrice
    },
    quantity,
    pricing: {
      pricePerUnit: basePrice,
      totalPrice: baseTotalPrice,
      originalTotal: baseTotalPrice,
      savings: 0,
      discountPercentage: 0,
      appliedRule: null
    }
  }
}

export const PRICING_SERVICE = {
  getAllPricings,
  getPricingsByProduct,
  getPricingById,
  createPricing,
  createBulkPricings,
  updatePricing,
  togglePricingStatus,
  deletePricing,
  deleteProductPricings,
  calculatePrice
}
