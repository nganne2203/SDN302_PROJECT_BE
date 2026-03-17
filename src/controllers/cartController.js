import { CART_SERVICE } from '#services/cartService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cart = await CART_SERVICE.getCart(userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: cart,
        message: 'Lấy giỏ hàng thành công'
      })
    )
  } catch (error) { next(error) }
}

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cart = await CART_SERVICE.addToCart(userId, req.body)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: cart,
        message: 'Thêm vào giỏ hàng thành công'
      })
    )
  } catch (error) { next(error) }
}

const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cart = await CART_SERVICE.updateCartItemQuantity(userId, req.body)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: cart,
        message: 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công'
      })
    )
  } catch (error) { next(error) }
}

const updateCartItemServices = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cart = await CART_SERVICE.updateCartItemServices(userId, req.body)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: cart,
        message: 'Cập nhật dịch vụ sản phẩm trong giỏ hàng thành công'
      })
    )
  } catch (error) { next(error) }
}

const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = req.validated?.query || req.query
    const cart = await CART_SERVICE.removeCartItem(userId, data)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: cart,
        message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
      })
    )
  } catch (error) { next(error) }
}

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id
    await CART_SERVICE.clearCart(userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: null,
        message: 'Xóa toàn bộ giỏ hàng thành công'
      })
    )
  } catch (error) { next(error) }
}

const validateCart = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cart = await CART_SERVICE.validateCartBeforeCheckout(userId)
    res.status(StatusCodes.OK).json(
      responseSuccess({
        data: cart,
        message: 'Giỏ hàng hợp lệ trước khi thanh toán'
      })
    )
  } catch (error) { next(error) }
}

export const CART_CONTROLLER = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  updateCartItemServices,
  removeCartItem,
  clearCart,
  validateCart
}
