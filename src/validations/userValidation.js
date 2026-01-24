import joi from 'joi'
import { ROLE_VALUES } from '#constants/roleConstant.js'
import {
  EMAIL_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX
} from '#constants/pattern.js'

export const USER_VALIDATION = {
  idParam: joi.object({
    id: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID không được để trống',
      'string.hex': 'ID không hợp lệ',
      'string.length': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc'
    }).trim()
  }),
  createUser: joi.object({
    fullname: joi.string().required().messages({
      'string.empty': 'Họ và tên không được để trống',
      'any.required': 'Họ và tên là bắt buộc',
      'any.max': 'Họ và tên không được vượt quá 100 ký tự'
    }).max(100).trim(),
    email: joi.string().email().required().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
      'string.pattern.base': 'Email không hợp lệ',
      'string.max': 'Email không được vượt quá 100 ký tự'
    }).max(100).trim(),
    password: joi.string().required().pattern(PASSWORD_REGEX).messages({
      'string.pattern.base': 'Mật khẩu phải từ 6-20 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc'
    }).min(6).max(20).trim(),
    phone: joi.string().optional().pattern(PHONE_REGEX).length(10).messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'string.length': 'Số điện thoại phải có 10 chữ số'
    }).trim(),
    branch: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }).trim(),
    role: joi.string().valid(...ROLE_VALUES).required().messages({
      'any.only': 'Vai trò không hợp lệ',
      'any.required': 'Vai trò là bắt buộc'
    }).trim(),
    avatar: joi.string().uri().optional().messages({
      'string.uri': 'URL ảnh đại diện không hợp lệ'
    }).trim(),
    addresses: joi.array().items(joi.object({
      fullname: joi.string().required().messages({
        'string.empty': 'Họ và tên không được để trống',
        'any.required': 'Họ và tên là bắt buộc',
        'any.max': 'Họ và tên không được vượt quá 100 ký tự'
      }).max(100).trim(),
      phone: joi.string().pattern(PHONE_REGEX).length(10).required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không hợp lệ',
        'string.length': 'Số điện thoại phải có 10 chữ số',
        'any.required': 'Số điện thoại là bắt buộc'
      }).trim(),
      addressLine: joi.string().required().messages({
        'string.empty': 'Địa chỉ không được để trống',
        'any.required': 'Địa chỉ là bắt buộc',
        'any.max': 'Địa chỉ không được vượt quá 200 ký tự'
      }).max(200).trim(),
      city: joi.string().required().messages({
        'string.empty': 'Thành phố không được để trống',
        'any.required': 'Thành phố là bắt buộc',
        'any.max': 'Thành phố không được vượt quá 100 ký tự'
      }).max(100).trim(),
      district: joi.string().required().messages({
        'string.empty': 'Quận/Huyện không được để trống',
        'any.required': 'Quận/Huyện là bắt buộc',
        'any.max': 'Quận/Huyện không được vượt quá 100 ký tự'
      }).max(100).trim(),
      ward: joi.string().required().messages({
        'string.empty': 'Phường/Xã không được để trống',
        'any.required': 'Phường/Xã là bắt buộc',
        'any.max': 'Phường/Xã không được vượt quá 100 ký tự'
      }).max(100).trim(),
      isDefault: joi.boolean().optional().default(false)
    })).optional()
  }),
  updateUser: joi.object({
    fullname: joi.string().optional().messages({
      'string.empty': 'Họ và tên không được để trống',
      'string.max': 'Họ và tên không được vượt quá 100 ký tự'
    }).max(100).trim(),
    email: joi.string().email().optional().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'string.pattern.base': 'Email không hợp lệ',
      'string.max': 'Email không được vượt quá 100 ký tự'
    }).max(100).trim(),
    phone: joi.string().optional().pattern(PHONE_REGEX).length(10).messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'string.length': 'Số điện thoại phải có 10 chữ số'
    }).trim(),
    branch: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }).trim(),
    role: joi.string().valid(...ROLE_VALUES).optional().messages({
      'any.only': 'Vai trò không hợp lệ'
    }).trim(),
    avatar: joi.string().uri().optional().messages({
      'string.uri': 'URL ảnh đại diện không hợp lệ'
    }).trim(),
    addresses: joi.array().items(joi.object({
      fullname: joi.string().required().messages({
        'string.empty': 'Họ và tên không được để trống',
        'any.required': 'Họ và tên là bắt buộc',
        'any.max': 'Họ và tên không được vượt quá 100 ký tự'
      }).max(100).trim(),
      phone: joi.string().pattern(PHONE_REGEX).length(10).required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không hợp lệ',
        'string.length': 'Số điện thoại phải có 10 chữ số',
        'any.required': 'Số điện thoại là bắt buộc'
      }).trim(),
      addressLine: joi.string().required().messages({
        'string.empty': 'Địa chỉ không được để trống',
        'any.required': 'Địa chỉ là bắt buộc',
        'any.max': 'Địa chỉ không được vượt quá 200 ký tự'
      }).max(200).trim(),
      city: joi.string().required().messages({
        'string.empty': 'Thành phố không được để trống',
        'any.required': 'Thành phố là bắt buộc',
        'any.max': 'Thành phố không được vượt quá 100 ký tự'
      }).max(100).trim(),
      district: joi.string().required().messages({
        'string.empty': 'Quận/Huyện không được để trống',
        'any.required': 'Quận/Huyện là bắt buộc',
        'any.max': 'Quận/Huyện không được vượt quá 100 ký tự'
      }).max(100).trim(),
      ward: joi.string().required().messages({
        'string.empty': 'Phường/Xã không được để trống',
        'any.required': 'Phường/Xã là bắt buộc',
        'any.max': 'Phường/Xã không được vượt quá 100 ký tự'
      }).max(100).trim(),
      isDefault: joi.boolean().optional().default(false)
    })).optional()
  }),
  updateUserStatus: joi.object({
    isActive: joi.boolean().required().messages({
      'any.required': 'Trạng thái hoạt động là bắt buộc'
    })
  }),
  updateCurrentUser: joi.object({
    fullname: joi.string().optional().messages({
      'string.empty': 'Họ và tên không được để trống',
      'any.max': 'Họ và tên không được vượt quá 100 ký tự'
    }).max(100).trim(),
    email: joi.string().email().optional().pattern(EMAIL_REGEX).messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'string.pattern.base': 'Email không hợp lệ',
      'string.max': 'Email không được vượt quá 100 ký tự'
    }).max(100).trim(),
    phone: joi.string().optional().pattern(PHONE_REGEX).length(10).messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'string.length': 'Số điện thoại phải có 10 chữ số'
    }).trim(),
    avatar: joi.string().uri().optional().messages({
      'string.uri': 'URL ảnh đại diện không hợp lệ'
    }).trim(),
    addresses: joi.array().items(joi.object({
      fullname: joi.string().required().messages({
        'string.empty': 'Họ và tên không được để trống',
        'any.required': 'Họ và tên là bắt buộc',
        'any.max': 'Họ và tên không được vượt quá 100 ký tự'
      }).max(100).trim(),
      phone: joi.string().pattern(PHONE_REGEX).length(10).required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không hợp lệ',
        'string.length': 'Số điện thoại phải có 10 chữ số',
        'any.required': 'Số điện thoại là bắt buộc'
      }).trim(),
      addressLine: joi.string().required().messages({
        'string.empty': 'Địa chỉ không được để trống',
        'any.required': 'Địa chỉ là bắt buộc',
        'any.max': 'Địa chỉ không được vượt quá 200 ký tự'
      }).max(200).trim(),
      city: joi.string().required().messages({
        'string.empty': 'Thành phố không được để trống',
        'any.required': 'Thành phố là bắt buộc',
        'any.max': 'Thành phố không được vượt quá 100 ký tự'
      }).max(100).trim(),
      district: joi.string().required().messages({
        'string.empty': 'Quận/Huyện không được để trống',
        'any.required': 'Quận/Huyện là bắt buộc',
        'any.max': 'Quận/Huyện không được vượt quá 100 ký tự'
      }).max(100).trim(),
      ward: joi.string().required().messages({
        'string.empty': 'Phường/Xã không được để trống',
        'any.required': 'Phường/Xã là bắt buộc',
        'any.max': 'Phường/Xã không được vượt quá 100 ký tự'
      }).max(100).trim(),
      isDefault: joi.boolean().optional().default(false)
    })).optional()
  }),
  query: joi.object({
    page: joi.number().integer().min(1).optional().messages({
      'number.base': 'Trang phải là số',
      'number.integer': 'Trang phải là số nguyên',
      'number.min': 'Trang phải lớn hơn hoặc bằng 1'
    }),
    limit: joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Giới hạn phải là số',
      'number.integer': 'Giới hạn phải là số nguyên',
      'number.min': 'Giới hạn phải lớn hơn hoặc bằng 1',
      'number.max': 'Giới hạn không được lớn hơn 100'
    }),
    search: joi.string().optional().trim(),
    isActive: joi.boolean().optional(),
    role: joi.string().valid(...ROLE_VALUES).optional().messages({
      'any.only': 'Vai trò không hợp lệ'
    }).trim(),
    sortBy: joi.string().optional().trim(),
    sortOrder: joi.string().valid('asc', 'desc').optional().messages({
      'any.only': 'Thứ tự sắp xếp không hợp lệ'
    }).trim()
  })
}