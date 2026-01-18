import { StatusCodes } from 'http-status-codes'

export const ERROR_CODES = {
  NOT_FOUND: {
    code: 'NOT_FOUND',
    statusCode: StatusCodes.NOT_FOUND,
    message: 'The requested resource was not found.'
  },

  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    statusCode: StatusCodes.UNAUTHORIZED,
    message: 'You are not authorized to access this resource.'
  },

  FORBIDDEN: {
    code: 'FORBIDDEN',
    statusCode: StatusCodes.FORBIDDEN,
    message: 'Access to this resource is forbidden.'
  },

  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'The request was invalid or cannot be served.'
  },

  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred on the server.'
  },

  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'There were validation errors with the request.'
  },

  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Rate limit exceeded. Please try again later.'
  },

  INVALID_REQUEST_DATA: {
    code: 'INVALID_REQUEST_DATA',
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'The request data is invalid.'
  },

  ACCOUNT_DISABLED: {
    code: 'ACCOUNT_DISABLED',
    statusCode: StatusCodes.FORBIDDEN,
    message: 'The account has been disabled.'
  },

  EMAIL_NOT_VERIFIED: {
    code: 'EMAIL_NOT_VERIFIED',
    statusCode: StatusCodes.FORBIDDEN,
    message: 'Email address has not been verified.'
  },

  EMAIL_ALREADY_VERIFIED: {
    code: 'EMAIL_ALREADY_VERIFIED',
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Email address is already verified.'
  },

  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'A server error occurred.'
  }
}