import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { PRODUCT_VALIDATION } from '#validations/productValidation.js'

export const CREATE_PRODUCT_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  PRODUCT_VALIDATION.createProduct
)
export const CREATE_PRODUCT_REQUIRED = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  PRODUCT_VALIDATION.createProduct
)
export const UPDATE_PRODUCT_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  PRODUCT_VALIDATION.updateProduct
)
export const QUERY_PRODUCT_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  PRODUCT_VALIDATION.query
)
export const UPDATE_PRODUCT_STATUS_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  PRODUCT_VALIDATION.updateProductStatus
)
