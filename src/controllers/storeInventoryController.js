import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const createStoreInventory = async (req, res, next) => {
  try {
    const { branch, product, quantity, minThreshold, maxThreshold } = req.body
    const userId = req.user.id
    const branchData = {
      branchId: branch,
      productId: product,
      quantity,
      minThreshold,
      maxThreshold
    }
    const storeInventory = await STORE_INVENTORY_SERVICE.createStoreInventory(
      branchData,
      userId
    )
    res.status(StatusCodes.CREATED).json(
      responseSuccess({
        data: storeInventory,
        message: 'Tạo tồn kho chi nhánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}
/**
 * GET /store-inventory/:branchId - Lấy danh sách tồn kho tại chi nhánh
 */
export const getStoreInventoriesByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const result = await STORE_INVENTORY_SERVICE.getStoreInventoriesByBranch(branchId, req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách tồn kho chi nhánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /store-inventory/:branchId/:productId - Lấy tồn kho sản phẩm tại chi nhánh
 */
export const getStoreInventory = async (req, res, next) => {
  try {
    const { branchId, productId } = req.params
    const storeInventory = await STORE_INVENTORY_SERVICE.getStoreInventoryByBranchAndProduct(branchId, productId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: storeInventory,
        message: 'Lấy tồn kho chi nhánh thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /store-inventory/:branchId/out-of-stock - Lấy sản phẩm hết hàng tại chi nhánh
 */
export const getOutOfStockProductsAtBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const result = await STORE_INVENTORY_SERVICE.getOutOfStockProductsAtBranch(branchId, req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách sản phẩm hết hàng thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /store-inventory/:branchId/low-stock - Lấy sản phẩm tồn kho thấp tại chi nhánh
 */
export const getLowStockProductsAtBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const result = await STORE_INVENTORY_SERVICE.getLowStockProductsAtBranch(branchId, req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách sản phẩm tồn kho thấp thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /store-inventory/:branchId/need-restock - Lấy sản phẩm cần bổ sung tồn kho
 */
export const getNeedRestockProducts = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const result = await STORE_INVENTORY_SERVICE.getNeedRestockProducts(branchId, req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách sản phẩm cần bổ sung thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /store-inventory/:branchId/overstock - Lấy sản phẩm tồn kho quá mức
 */
export const getOverstockProducts = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const result = await STORE_INVENTORY_SERVICE.getOverstockProducts(branchId, req.validated.query)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: result.data,
        pagination: result.pagination,
        message: 'Lấy danh sách sản phẩm tồn kho quá mức thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /store-inventory/:branchId/:productId/thresholds - Cập nhật ngưỡng tồn kho
 */
export const updateThresholds = async (req, res, next) => {
  try {
    const { branchId, productId } = req.params
    const { minThreshold, maxThreshold } = req.body
    const userId = req.user.id
    const storeInventory = await STORE_INVENTORY_SERVICE.updateThresholds(
      branchId,
      productId,
      { minThreshold, maxThreshold },
      userId
    )
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: storeInventory,
        message: 'Cập nhật ngưỡng tồn kho thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /store-inventory/:inventoryId - Xóa tồn kho (soft delete)
 */
export const deleteStoreInventory = async (req, res, next) => {
  try {
    const { inventoryId } = req.params
    const userId = req.user.id
    await STORE_INVENTORY_SERVICE.deleteStoreInventory(inventoryId, userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        message: 'Xóa tồn kho thành công'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const STORE_INVENTORY_CONTROLLER = {
  createStoreInventory,
  getStoreInventoriesByBranch,
  getStoreInventory,
  getOutOfStockProductsAtBranch,
  getLowStockProductsAtBranch,
  getNeedRestockProducts,
  getOverstockProducts,
  updateThresholds,
  deleteStoreInventory
}
