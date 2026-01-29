import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { CART_VALIDATION } from '#validations/cartValidation.js'

const ADD_TO_CART_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CART_VALIDATION.addToCart
)

const ADD_TO_CART_REQUIRED_FIELDS = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  CART_VALIDATION.addToCart
)

const UPDATE_CART_ITEM_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CART_VALIDATION.updateCartItem
)
const UPDATE_CART_SERVICES_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CART_VALIDATION.updateCartServices
)
const REMOVE_CART_ITEM_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CART_VALIDATION.removeCartItem
)

export const CART_CONSTANT = {
  ADD_TO_CART_FIELDS,
  ADD_TO_CART_REQUIRED_FIELDS,
  UPDATE_CART_ITEM_FIELDS,
  UPDATE_CART_SERVICES_FIELDS,
  REMOVE_CART_ITEM_FIELDS
}
