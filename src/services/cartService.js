import { CART_REPOSITORY } from '#repositories/cartRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { PRODUCT_SERVICE } from '#services/productService.js'
import { SERVICE_ITEM_SERVICE } from '#services/serviceItemService.js'
import { STORE_INVENTORY_SERVICE } from '#services/storeInventoryService.js'
import { INVENTORY_SERVICE } from '#services/inventoryService.js'
import mongoose from 'mongoose'

const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => {
    const serviceFee =
      typeof item.serviceFee === 'number'
        ? Number(item.serviceFee)
        : (item.services || []).reduce(
          (sum, s) => sum + (Number(s.price) || 0),
          0
        )

    const price = Number(item.price) || 0
    const quantity = Number(item.quantity) || 0

    return total + (price + serviceFee) * quantity
  }, 0)
}

const normalizeServiceIds = (services = []) => {
  if (!Array.isArray(services)) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, [
      'services phải là một mảng'
    ])
  }

  const errors = []

  const ids = services
    .map((service, index) => {
      const rawId =
        typeof service === 'string'
          ? service
          : service?.service || service?.serviceId || service?._id

      const serviceId =
        rawId instanceof mongoose.Types.ObjectId
          ? rawId.toString()
          : typeof rawId === 'string'
            ? rawId.trim()
            : ''

      if (!serviceId) {
        errors.push(`services[${index}].serviceId là bắt buộc`)
        return null
      }

      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        errors.push(`services[${index}].serviceId không hợp lệ`)
        return null
      }

      return serviceId
    })
    .filter(Boolean)

  if (errors.length > 0) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, errors)
  }

  return ids
}

const validateServiceItems = async (productId, services) => {
  await PRODUCT_SERVICE.getProductById(productId)

  const normalizedIds = normalizeServiceIds(services)
  const validated = []

  for (const id of normalizedIds) {
    const service = await SERVICE_ITEM_SERVICE.getServiceById(id)

    if (!service.product) {
      throw new ApiError(ERROR_CODES.NOT_FOUND, [
        'Không tìm thấy sản phẩm của dịch vụ'
      ])
    }

    if (service.product.toString() !== productId.toString()) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [
        `Dịch vụ ${service.name} không thuộc về sản phẩm`
      ])
    }

    if (!service.isActive) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [
        `Dịch vụ ${service.name} hiện không khả dụng`
      ])
    }

    validated.push({
      service: service._id,
      name: service.name,
      price: service.price
    })
  }

  return validated
}

const checkStockAvailability = async (productId, quantity) => {
  const inventories =
    await STORE_INVENTORY_SERVICE.getStoreInventoriesByProduct(productId)

  for (const inventory of inventories) {
    if (inventory.quantity >= quantity) return true
  }

  try {
    const mainInventory = await INVENTORY_SERVICE.getInventoryByProductId(productId)
    if (mainInventory.quantity >= quantity) {
      return true
    }
  } catch (error) {
    if (error?.code !== ERROR_CODES.NOT_FOUND.code) {
      throw error
    }
  }

  throw new ApiError(ERROR_CODES.BAD_REQUEST, [
    'Không đủ số lượng trong hệ thống'
  ])
}

const getCart = async (userId) => {
  const cart = await CART_REPOSITORY.getCartByUserId(userId)

  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }

  const cartObj = cart.toJSON ? cart.toJSON() : cart

  const mappedItems = (cartObj.items || []).map((item) => {
    const mappedServices = (item.services || []).map((s) => ({
      service: s.service,
      name: s.name,
      price: Number(s.price) || 0
    }))

    const mappedProduct = item.product
      ? PRODUCT_SERVICE.mapProductImages(item.product)
      : undefined

    const serviceFee = mappedServices.reduce(
      (sum, s) => sum + (Number(s.price) || 0),
      0
    )

    return {
      ...item,
      product: mappedProduct,
      services: mappedServices,
      serviceFee,
      totalPrice: (Number(item.price) + serviceFee) * Number(item.quantity)
    }
  })

  return {
    ...cartObj,
    items: mappedItems,
    totalPrice: calculateTotalPrice(mappedItems)
  }
}

const createCart = async (userId) => {
  return CART_REPOSITORY.createCart(userId)
}

const getOrCreateCart = async (userId) => {
  const cart = await CART_REPOSITORY.getOrCreateCart(userId)
  return CART_REPOSITORY.getCartByUserId(cart.user, { populate: true })
}

const addToCart = async (userId, data) => {
  const { productId, quantity, services = [] } = data

  const product = await PRODUCT_SERVICE.getProductById(productId)

  if (!product.isActive) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Sản phẩm hiện không khả dụng'
    ])
  }

  const validatedServices =
    services.length > 0 ? await validateServiceItems(productId, services) : []

  await checkStockAvailability(productId, quantity)

  const cart = await CART_REPOSITORY.getOrCreateCart(userId)

  const newServiceIds = validatedServices
    .map((s) => s.service.toString())
    .sort()

  const index = cart.items.findIndex((item) => {
    if (item.product.toString() !== productId.toString()) return false

    const existingServiceIds = (item.services || [])
      .map((s) => s.service.toString())
      .sort()

    return JSON.stringify(existingServiceIds) === JSON.stringify(newServiceIds)
  })

  if (index > -1) {
    const newQuantity = cart.items[index].quantity + quantity

    await checkStockAvailability(productId, newQuantity)

    cart.items[index].quantity = newQuantity

    // update service (nếu user chọn lại)
    cart.items[index].services = validatedServices
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      services: validatedServices
    })
  }

  // cập nhật lại giá
  for (const item of cart.items) {
    const serviceFee = (item.services || []).reduce(
      (sum, s) => sum + (Number(s.price) || 0),
      0
    )

    item.serviceFee = serviceFee

    item.totalPrice = (Number(item.price) + serviceFee) * Number(item.quantity)
  }

  cart.totalPrice = calculateTotalPrice(cart.items)

  await cart.save()

  return cart
}

const updateCartItemQuantity = async (userId, data) => {
  const { productId, quantity } = data

  await PRODUCT_SERVICE.getProductById(productId)
  await checkStockAvailability(productId, quantity)

  const cart = await CART_REPOSITORY.getCartByUserId(userId, {
    populate: false
  })

  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }

  const index = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  )

  if (index === -1) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, [
      'Sản phẩm không tồn tại trong giỏ'
    ])
  }

  cart.items[index].quantity = quantity

  const serviceFee = (cart.items[index].services || []).reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0
  )

  cart.items[index].serviceFee = serviceFee

  cart.items[index].totalPrice =
  (Number(cart.items[index].price) + serviceFee) *
  Number(cart.items[index].quantity)

  cart.totalPrice = calculateTotalPrice(cart.items)

  await cart.save()

  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const updateCartItemServices = async (userId, data) => {
  const { itemId, productId, services = [] } = data

  const cart = await CART_REPOSITORY.getCartByUserId(userId, {
    populate: false
  })

  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }

  const index = itemId
    ? cart.items.findIndex((item) => item._id.toString() === itemId.toString())
    : cart.items.findIndex((item) => item.product.toString() === productId.toString())

  if (index === -1) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, [
      'Sản phẩm không tồn tại trong giỏ'
    ])
  }

  const resolvedProductId = cart.items[index].product
  await PRODUCT_SERVICE.getProductById(resolvedProductId)

  const validatedServices =
    services.length > 0 ? await validateServiceItems(resolvedProductId, services) : []

  cart.items[index].services = validatedServices

  const serviceFee = (validatedServices || []).reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0
  )

  cart.items[index].serviceFee = serviceFee

  cart.items[index].totalPrice =
  (Number(cart.items[index].price) + serviceFee) *
  Number(cart.items[index].quantity)

  cart.totalPrice = calculateTotalPrice(cart.items)

  await cart.save()

  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const removeCartItem = async (userId, data) => {
  const { itemId, productId } = data

  const cart = await CART_REPOSITORY.getCartByUserId(userId, {
    populate: false
  })

  if (!cart) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Giỏ hàng không tồn tại'])
  }

  const initialLength = cart.items.length

  cart.items = itemId
    ? cart.items.filter((item) => item._id.toString() !== itemId.toString())
    : cart.items.filter((item) => item.product.toString() !== productId.toString())

  if (cart.items.length === initialLength) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, [
      'Sản phẩm không tồn tại trong giỏ'
    ])
  }

  cart.totalPrice = calculateTotalPrice(cart.items)

  await cart.save()

  return CART_REPOSITORY.getCartByUserId(userId, { populate: true })
}

const clearCart = async (userId) => {
  return CART_REPOSITORY.clearCart(userId)
}

const validateCartBeforeCheckout = async (userId) => {
  const cart = await CART_REPOSITORY.getCartByUserId(userId, {
    populate: false
  })

  if (!cart || cart.items.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Giỏ hàng đang trống'])
  }

  for (const item of cart.items) {
    const product = await PRODUCT_SERVICE.getProductById(item.product)

    if (!product.isActive) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [
        `Sản phẩm ${product.name} hiện không khả dụng`
      ])
    }

    await checkStockAvailability(item.product, item.quantity)

    if (product.price !== item.price) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, [
        `Giá sản phẩm ${product.name} đã thay đổi, vui lòng kiểm tra lại giỏ hàng`
      ])
    }

    for (const serviceItem of item.services || []) {
      const service = await SERVICE_ITEM_SERVICE.getServiceById(
        serviceItem.service
      )

      if (!service) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Dịch vụ không tồn tại'])
      }

      if (!service.isActive) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, [
          `Dịch vụ ${service.name} hiện không khả dụng`
        ])
      }

      if (service.price !== serviceItem.price) {
        throw new ApiError(ERROR_CODES.BAD_REQUEST, [
          `Giá dịch vụ ${service.name} đã thay đổi`
        ])
      }
    }
  }

  return cart
}

export const CART_SERVICE = {
  getCart,
  createCart,
  getOrCreateCart,
  addToCart,
  updateCartItemQuantity,
  updateCartItemServices,
  removeCartItem,
  clearCart,
  validateCartBeforeCheckout
}
