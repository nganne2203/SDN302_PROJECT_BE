import joi from 'joi'
import {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX
} from '#constants/pattern.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

export const AUTH_VALIDATION = {
  registerUser: joi.object({
    fullname: joi.string().required().messages({
      'string.empty': 'Họ và tên không được để trống',
      'any.required': 'Họ và tên là bắt buộc'
    }).trim(),
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
      'string.pattern.base': 'Email không hợp lệ'
    }).trim(),
    password: joi.string().pattern(PASSWORD_REGEX).required().messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.pattern.base': 'Mật khẩu phải từ 8-20 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      'any.required': 'Mật khẩu là bắt buộc'
    }).trim(),
    phone: joi.string().pattern(PHONE_REGEX).length(10).optional().messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ'
    }).trim(),
    addresses: joi.object({
      fullname: joi.string().required().messages({
        'string.empty': 'Họ và tên không được để trống',
        'any.required': 'Họ và tên là bắt buộc'
      }).trim(),
      phone: joi.string().pattern(PHONE_REGEX).length(10).required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không hợp lệ'
      }).trim(),
      addressLine: joi.string().required().messages({
        'string.empty': 'Địa chỉ không được để trống',
        'any.required': 'Địa chỉ là bắt buộc'
      }).trim(),
      city: joi.string().required().messages({
        'string.empty': 'Thành phố không được để trống',
        'any.required': 'Thành phố là bắt buộc'
      }).trim(),
      district: joi.string().required().messages({
        'string.empty': 'Quận/Huyện không được để trống',
        'any.required': 'Quận/Huyện là bắt buộc'
      }).trim(),
      ward: joi.string().required().messages({
        'string.empty': 'Phường/Xã không được để trống',
        'any.required': 'Phường/Xã là bắt buộc'
      }).trim(),
      isDefault: joi.boolean().optional().default(false)
    }).optional(),
    avatar: joi.string().uri().optional().messages({
      'string.uri': 'URL ảnh đại diện không hợp lệ'
    }).trim(),
    captchaToken: joi.string().required().messages({
      'string.empty': 'Captcha token không được để trống',
      'any.required': 'Captcha token là bắt buộc'
    }).trim()
  }),
  loginUser: joi.object({
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ'
    }).trim(),
    password: joi.string().required().messages({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc'
    }).trim(),
    captchaToken: joi.string().required().messages({
      'string.empty': 'Captcha token không được để trống',
      'any.required': 'Captcha token là bắt buộc'
    }).trim()
  }),
  loginUserNoCaptcha: joi.object({
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ'
    }).trim(),
    password: joi.string().required().messages({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc'
    }).trim()
  }),
  verifyOtp: joi.object({
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
      'string.pattern.base': 'Email không hợp lệ'
    }).trim(),
    code: joi.string().required().messages({
      'string.empty': 'Mã xác thực không được để trống',
      'any.required': 'Mã xác thực là bắt buộc'
    }).trim(),
    type: joi.string().valid(...Object.values(VERIFY_TYPE)).required().messages({
      'any.only': 'Loại xác thực không hợp lệ',
      'any.required': 'Loại xác thực là bắt buộc'
    }).trim()
  }),
  resendVerificationCode: joi.object({
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
      'string.pattern.base': 'Email không hợp lệ'
    }).trim(),
    type: joi.string().valid(...Object.values(VERIFY_TYPE)).required().messages({
      'any.only': 'Loại xác thực không hợp lệ',
      'any.required': 'Loại xác thực là bắt buộc'
    }).trim()
  }),
  refreshToken: joi.object({
    refreshToken: joi.string().required().messages({
      'string.empty': 'Refresh token không được để trống',
      'any.required': 'Refresh token là bắt buộc'
    }).trim()
  }),
  logout: joi.object({
    refreshToken: joi.string().required().messages({
      'string.empty': 'Refresh token không được để trống',
      'any.required': 'Refresh token là bắt buộc'
    }).trim()
  })
}