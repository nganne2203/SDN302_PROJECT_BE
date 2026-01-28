import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const createStoreInventory = async (req, res, next) => {
  try {
    const { branch, product, quantity } = req.body
    const userId = req.user.id
    const storeInventory = await STORE_INVENTORY_SERVICE.createStoreInventory(
      branch,
      product,
      quantity,
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

export const STORE_INVENTORY_CONTROLLER = {
  createStoreInventory,
  getStoreInventoriesByBranch,
  getStoreInventory,
  getOutOfStockProductsAtBranch
}
