import joi from 'joi'
import {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX
} from '#constants/pattern.js'

export const AUTH_VALIDATION = {
  registerUser: joi.object({
    fullname: joi.string().required().messages({
      'string.empty': 'Họ và tên không được để trống',
      'any.required': 'Họ và tên là bắt buộc'
    }),
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
      'string.pattern.base': 'Email không hợp lệ'
    }),
    password: joi.string().pattern(PASSWORD_REGEX).required().messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.pattern.base': 'Mật khẩu phải từ 8-20 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      'any.required': 'Mật khẩu là bắt buộc'
    }),
    phone: joi.string().pattern(PHONE_REGEX).length(10).optional(),
    address: joi.object({
      fullname: joi.string().required().messages({
        'string.empty': 'Họ và tên không được để trống',
        'any.required': 'Họ và tên là bắt buộc'
      }),
      phone: joi.string().pattern(PHONE_REGEX).length(10).required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không hợp lệ'
      }),
      addressLine: joi.string().required().messages({
        'string.empty': 'Địa chỉ không được để trống',
        'any.required': 'Địa chỉ là bắt buộc'
      }),
      city: joi.string().required().messages({
        'string.empty': 'Thành phố không được để trống',
        'any.required': 'Thành phố là bắt buộc'
      }),
      district: joi.string().required().messages({
        'string.empty': 'Quận/Huyện không được để trống',
        'any.required': 'Quận/Huyện là bắt buộc'
      }),
      ward: joi.string().required().messages({
        'string.empty': 'Phường/Xã không được để trống',
        'any.required': 'Phường/Xã là bắt buộc'
      }),
      isDefault: joi.boolean().optional().default(false)
    }).optional(),
    avatar: joi.string().uri().optional().messages({
      'string.uri': 'URL ảnh đại diện không hợp lệ'
    })
  }),
  loginUser: joi.object({
    email: joi.string().email().required().pattern(EMAIL_REGEX),
    password: joi.string().required()
  })
}