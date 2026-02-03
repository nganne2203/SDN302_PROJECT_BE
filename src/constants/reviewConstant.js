import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { REVIEW_VALIDATION } from '#validations/reviewValidation.js'

export const REVIEW_RATING = {
  MIN: 1,
  MAX: 5
}

const CREATE_REVIEW_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  REVIEW_VALIDATION.createReview
)

const CREATE_REVIEW_REQUIRED_FIELDS = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  REVIEW_VALIDATION.createReview
)

const UPDATE_REVIEW_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  REVIEW_VALIDATION.updateReview
)

export const REVIEW_CONSTANT = {
  CREATE_REVIEW_FIELDS,
  CREATE_REVIEW_REQUIRED_FIELDS,
  UPDATE_REVIEW_FIELDS
}
