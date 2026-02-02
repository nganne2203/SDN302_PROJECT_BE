import { PRICING_SERVICE } from '#services/pricingService.js'
import { StatusCodes } from 'http-status-codes'

/**
 * Get all pricing rules with pagination
 */
const getAllPricings = async (req, res, next) => {
  try {
    const result = await PRICING_SERVICE.getAllPricings(req.validated.query)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách bảng giá thành công',
      ...result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get pricing rules by product ID
 */
const getPricingsByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params
    const result = await PRICING_SERVICE.getPricingsByProduct(productId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy bảng giá sản phẩm thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get pricing by ID
 */
const getPricingById = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await PRICING_SERVICE.getPricingById(id)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy thông tin bảng giá thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new pricing rule
 */
const createPricing = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await PRICING_SERVICE.createPricing(req.body, userId)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo bảng giá thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create bulk pricing tiers for a product
 */
const createBulkPricings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { productId, tiers } = req.body
    const result = await PRICING_SERVICE.createBulkPricings(productId, tiers, userId)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo các mức giá thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a pricing rule
 */
const updatePricing = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const result = await PRICING_SERVICE.updatePricing(id, req.body, userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật bảng giá thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Toggle pricing active status
 */
const togglePricingStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const result = await PRICING_SERVICE.togglePricingStatus(id, userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.isActive ? 'Kích hoạt bảng giá thành công' : 'Vô hiệu hóa bảng giá thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a pricing rule
 */
const deletePricing = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await PRICING_SERVICE.deletePricing(id)
    res.status(StatusCodes.OK).json({
      success: true,
      ...result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete all pricing rules for a product
 */
const deleteProductPricings = async (req, res, next) => {
  try {
    const { productId } = req.params
    const result = await PRICING_SERVICE.deleteProductPricings(productId)
    res.status(StatusCodes.OK).json({
      success: true,
      ...result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Calculate price for a product with quantity
 */
const calculatePrice = async (req, res, next) => {
  try {
    const { productId } = req.params
    const { quantity } = req.validated.query
    const result = await PRICING_SERVICE.calculatePrice(productId, parseInt(quantity) || 1)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Tính giá thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const PRICING_CONTROLLER = {
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
