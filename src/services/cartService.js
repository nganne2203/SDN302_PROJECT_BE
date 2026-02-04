import { CART_REPOSITORY } from '#repositories/cartRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { SERVICE_ITEM_SERVICE } from '#services/serviceItemService.js'
import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'

const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => {
    const serviceTotal = item.services.reduce((sum, s) => sum + s.price, 0)
    return total + (item.price * item.quantity) + (serviceTotal * item.quantity)
  }, 0)
}

const validateServiceItems = async (productId, services) => {
  await PRODUCT_SERVICE.getProductById(productId)

  const validatedServices = []

  for (const serviceId of services) {
    const service = await SERVICE_ITEM_SERVICE.getServiceById(serviceId)
    if (service.product.toString() !== productId.toString()) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Dịch vụ ${service.name} không thuộc về sản phẩm tương ứng`])
    }
    if (!service.isActive) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Dịch vụ ${service.name} hiện không khả dụng`])
    }
    validatedServices.push({
      service: service._id,
      price: service.price
    })
  }
  return validatedServices
}

const checkStockAvailability = async (productId, quantity) => {
  const storeInventories = await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(productId)
  if (storeInventories.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Sản phẩm hiện không có trong kho'])
  }
  for (const inventory of storeInventories) {
    if (inventory.quantity >= quantity) {
      return true
    }
  }
  throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không đủ tồn kho tại chi nhánh'])
}

const getCart = async (userId) => {
  const cart = await CART_REPOSITORY.getCartByUserId(userId)
  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }
  return cart
}

const addToCart = async (userId, data) => {
  const { productId, quantity, services = [] } = data
  const product = await PRODUCT_SERVICE.getProductById(productId)
  if (!product.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Sản phẩm hiện không khả dụng'])
  }
  const validatedServices = services.length > 0
    ? await validateServiceItems(productId, services)
    : []
  await checkStockAvailability(productId, quantity)
  let cart = await CART_REPOSITORY.getOrCreateCart(userId)
  const existingCartItem = cart.items.findIndex(item => item.product.toString() === productId.toString())
  if (existingCartItem > -1) {
    const newQuantity = cart.items[existingCartItem].quantity + quantity
    await checkStockAvailability(productId, newQuantity)
    cart.items[existingCartItem].quantity = newQuantity
    cart.items[existingCartItem].services = validatedServices
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      services: validatedServices
    })
  }

  cart.totalPrice = calculateTotalPrice(cart.items)
  await cart.save()
  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const updateCartItemQuantity = async (userId, data) => {
  const { productId, quantity } = data
  await PRODUCT_SERVICE.getProductById(productId)
  await checkStockAvailability(productId, quantity)
  const cart = await CART_REPOSITORY.getCartByUserId(userId, { populate: false })
  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }

  const cartItemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString())
  if (cartItemIndex === -1) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại trong giỏ hàng'])
  }
  cart.items[cartItemIndex].quantity = quantity
  cart.totalPrice = calculateTotalPrice(cart.items)
  await cart.save()
  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const getOrCreateCart = async (userId) => {
  return await CART_REPOSITORY.getOrCreateCart(userId)
}

const updateCartItemServices = async (userId, data) => {
  const { productId, services = [] } = data
  await PRODUCT_SERVICE.getProductById(productId)
  const validatedServices = services.length > 0
    ? await validateServiceItems(productId, services)
    : []
  const cart = await CART_REPOSITORY.getCartByUserId(userId, { populate: false })
  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }
  const cartItemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString())
  if (cartItemIndex === -1) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại trong giỏ hàng'])
  }
  cart.items[cartItemIndex].services = validatedServices
  cart.totalPrice = calculateTotalPrice(cart.items)
  await cart.save()
  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const removeCartItem = async (userId, data) => {
  const { productId } = data
  const cart = await CART_REPOSITORY.getCartByUserId(userId, { populate: false })
  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }
  const initialLength = cart.items.length
  cart.items = cart.items.filter(item => item.product.toString() !== productId.toString())
  if (cart.items.length === initialLength) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Sản phẩm không tồn tại trong giỏ hàng'])
  }
  cart.totalPrice = calculateTotalPrice(cart.items)
  await cart.save()
  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const clearCart = async (userId) => {
  return await CART_REPOSITORY.clearCart(userId)
}

const validateCartBeforeCheckout = async (userId) => {
  const cart = await CART_REPOSITORY.getCartByUserId(userId, { populate: false })
  if (!cart || cart.items.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Giỏ hàng đang trống'])
  }
  for (const item of cart.items) {
    const product = await PRODUCT_SERVICE.getProductById(item.product)
    if (!product.isActive) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Sản phẩm ${product.name} hiện không khả dụng`])
    }
    await checkStockAvailability(item.product, item.quantity)
    if (product.price !== item.price) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Giá sản phẩm ${product.name} đã thay đổi, vui lòng kiểm tra lại giỏ hàng`])
    }
    for (const serviceItem of item.services) {
      const service = await SERVICE_ITEM_SERVICE.getServiceById(serviceItem.service)
      if (!service || !service.isActive) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Dịch vụ ${service.name} hiện không khả dụng`])
      }
      if (service.price !== serviceItem.price) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, [`Giá dịch vụ ${service.name} đã thay đổi, vui lòng kiểm tra lại giỏ hàng`])
      }
    }
  }
  return cart
}

export const CART_SERVICE = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  updateCartItemServices,
  removeCartItem,
  clearCart,
  validateCartBeforeCheckout,
  getOrCreateCart
}