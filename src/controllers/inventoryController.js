import { INVENTORY_SERVICE } from '#services/inventoryService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

/**
 * GET /inventory/:productId - Lấy thông tin tồn kho
 */
export const getInventory = async (req, res, next) => {
  try {
    const { productId } = req.params
    const inventory = await INVENTORY_SERVICE.getInventoryByProductId(productId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: inventory,
        message: 'Lấy thông tin tồn kho thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /inventory - Lấy danh sách tất cả inventory
 */
export const getAllInventories = async (req, res, next) => {
  try {
    const result = await INVENTORY_SERVICE.getAllInventories(req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách inventory thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

const updateInventory = async (req, res, next) => {
  try {
    const { inventoryId } = req.params
    const userId = req.user.id
    const inventory = await INVENTORY_SERVICE.updateInventory(inventoryId, req.body, userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: inventory,
        message: 'Cập nhật inventory thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /inventory/low-stock - Lấy danh sách sản phẩm sắp hết hàng
 */
export const getLowStockProducts = async (req, res, next) => {
  try {
    const result = await INVENTORY_SERVICE.getLowStockProducts(req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách sản phẩm sắp hết hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * POST /inventory - Tạo inventory mới
 */
export const createInventory = async (req, res, next) => {
  try {
    const { product, quantity = 0, location = '' } = req.body
    const userId = req.user.id

    const inventory = await INVENTORY_SERVICE.createInventory(product, quantity, location, userId)
    res.status(StatusCodes.CREATED).json(
      responseSuccess({
        data: inventory,
        message: 'Tạo inventory thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /inventory/:productId/adjust - Điều chỉnh tồn kho
 */
export const adjustInventory = async (req, res, next) => {
  try {
    const { productId } = req.params
    const { quantity } = req.body
    const userId = req.user.id

    const inventory = await INVENTORY_SERVICE.adjustInventoryQuantity(productId, quantity, userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: inventory,
        message: 'Điều chỉnh tồn kho thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const INVENTORY_CONTROLLER = {
  getInventory,
  getAllInventories,
  getLowStockProducts,
  createInventory,
  adjustInventory,
  updateInventory
}
