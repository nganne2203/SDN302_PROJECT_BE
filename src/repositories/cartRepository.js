import { cartModel } from '#models/cartModel.js'

const getCartByUserId = async (userId, options = {}) => {
  const { populate = true } = options
  let query = cartModel.findOne({ user: userId })
  if (populate) {
    query = query
      .populate('user', 'fullname email')
      .populate('items.product', 'name price images slug category')
      .populate('items.services.service', 'name type price')
  }
  return await query.exec()
}

const createCart = async (userId) => {
  return await cartModel.create({
    user: userId,
    items: [],
    totalPrice: 0
  })
}

const getOrCreateCart = async (userId) => {
  let cart = await getCartByUserId(userId, { populate: false })
  if (!cart) {
    cart = await createCart(userId)
  }
  return cart
}

const updateCart = async (cartId, updateData) => {
  return await cartModel.findByIdAndUpdate(
    cartId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'fullname email')
    .populate('items.product', 'name price images slug category')
    .populate('items.services.service', 'name type price')
}

const clearCart = async (userId) => {
  return await cartModel.findOneAndUpdate(
    { user: userId },
    { items: [], totalPrice: 0 },
    { new: true }
  )
    .populate('user', 'fullname email')
}

const deleteCart = async (userId) => {
  return await cartModel.findOneAndDelete({ user: userId })
}

const getCartItemByProduct = async (userId, productId) => {
  const cart = await cartModel.findOne({ user: userId })
  if (!cart) return null
  return cart.items.find(item => item.product.toString() === productId)
}

export const CART_REPOSITORY = {
  getCartByUserId,
  createCart,
  getOrCreateCart,
  updateCart,
  clearCart,
  deleteCart,
  getCartItemByProduct
}