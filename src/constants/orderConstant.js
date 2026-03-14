import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { ORDER_VALIDATION } from '#validations/orderValidation.js'

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  SHIPPING: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
}

export const ORDER_TYPE = {
  ONLINE: 'online',
  OFFLINE: 'offline'
}

export const SHIPPING_FEE = {
  INTER_PROVINCE: 50000,
  INTRA_PROVINCE: 0
}

const CREATE_ORDER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  ORDER_VALIDATION.createOrder
)

const CREATE_ORDER_REQUIRED_FIELDS = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  ORDER_VALIDATION.createOrder
)

const UPDATE_ORDER_STATUS_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  ORDER_VALIDATION.updateOrderStatus
)

const CANCEL_ORDER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  ORDER_VALIDATION.cancelOrder
)

const UPDATE_DELIVERY_INFO_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  ORDER_VALIDATION.updateDeliveryInfo
)

const UPDATE_SHIPPING_FEE_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  ORDER_VALIDATION.updateShippingFee
)

const CREATE_OFFLINE_ORDER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  ORDER_VALIDATION.createOfflineOrder
)

const CREATE_OFFLINE_ORDER_REQUIRED_FIELDS = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  ORDER_VALIDATION.createOfflineOrder
)

export const ORDER_CONSTANT = {
  CREATE_ORDER_FIELDS,
  CREATE_ORDER_REQUIRED_FIELDS,
  UPDATE_ORDER_STATUS_FIELDS,
  CANCEL_ORDER_FIELDS,
  UPDATE_DELIVERY_INFO_FIELDS,
  UPDATE_SHIPPING_FEE_FIELDS,
  CREATE_OFFLINE_ORDER_FIELDS,
  CREATE_OFFLINE_ORDER_REQUIRED_FIELDS
}
