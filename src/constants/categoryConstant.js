import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { CATEGORY_VALIDATION } from '#validations/categoryValidation.js'

export const CREATE_CATEGORY_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CATEGORY_VALIDATION.createCategory
)
export const CREATE_CATEGORY_REQUIRED = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  CATEGORY_VALIDATION.createCategory
)
export const UPDATE_CATEGORY_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CATEGORY_VALIDATION.updateCategory
)
export const QUERY_CATEGORY_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  CATEGORY_VALIDATION.query
)
export const UPDATE_CATEGORY_STATUS = GENERATE_UTILS.extractFieldsFromJoi(
  CATEGORY_VALIDATION.updateCategoryStatus
)