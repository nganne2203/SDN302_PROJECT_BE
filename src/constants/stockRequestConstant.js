import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { STOCK_REQUEST_VALIDATION } from '#validations/stockRequestValidation.js'

export const STOCK_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

const CREATE_STOCK_REQUEST = GENERATE_UTILS.extractFieldsFromJoi(
  STOCK_REQUEST_VALIDATION.createStockRequest
)

const CREATE_STOCK_REQUEST_REQUIRED = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  STOCK_REQUEST_VALIDATION.createStockRequest
)

const REJECT_STOCK_REQUEST = GENERATE_UTILS.extractFieldsFromJoi(
  STOCK_REQUEST_VALIDATION.rejectStockRequest
)

export const STOCK_REQUEST_CONSTANT = {
  STOCK_REQUEST_STATUS,
  CREATE_STOCK_REQUEST,
  CREATE_STOCK_REQUEST_REQUIRED,
  REJECT_STOCK_REQUEST
}