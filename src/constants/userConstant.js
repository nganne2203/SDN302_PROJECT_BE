import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { AUTH_VALIDATION } from '#validations/authValidation.js'
import { USER_VALIDATION } from '#validations/userValidation.js'

export const USER_PROVIDER = {
  LOCAL: 'local',
  GOOGLE: 'google'
}

export const LOGIN_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.loginUser
)

export const REGISTER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.registerUser
)

export const REQUIRE_FIELD_REGISTER = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  AUTH_VALIDATION.registerUser
)

export const VERIFY_OTP_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.verifyOtp
)

export const RESEND_OTP_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.resendVerificationCode
)

export const REFRESH_TOKEN_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.refreshToken
)

export const CHANGE_PASSWORD_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.changePassword
)

export const RESET_PASSWORD_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  AUTH_VALIDATION.resetPassword
)

export const CREATE_USER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  USER_VALIDATION.createUser
)
export const REQUIRE_FIELD_CREATE_USER = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  USER_VALIDATION.createUser
)

export const UPDATE_USER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  USER_VALIDATION.updateUser
)
export const UPDATE_STATUS_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  USER_VALIDATION.updateUserStatus
)
export const UPDATE_CURRENT_USER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  USER_VALIDATION.updateCurrentUser
)
export const QUERY_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  USER_VALIDATION.query
)