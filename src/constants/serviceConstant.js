import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { SERVICE_VALIDATION } from '#validations/serviceValidation.js'

export const CREATE_SERVICE_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  SERVICE_VALIDATION.createService
)

export const CREATE_SERVICE_REQUIRED = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  SERVICE_VALIDATION.createService
)

export const UPDATE_SERVICE_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  SERVICE_VALIDATION.updateService
)

export const UPDATE_SERVICE_STATUS = GENERATE_UTILS.extractFieldsFromJoi(
  SERVICE_VALIDATION.updateServiceStatus
)

export const QUERY_SERVICE_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  SERVICE_VALIDATION.query
)
