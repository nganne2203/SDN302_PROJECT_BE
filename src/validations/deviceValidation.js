import joi from 'joi'
import { DEVICE_TYPES } from '#constants/deviceConstant.js'
import { GENERATE_UTILS } from '#utils/generateUtil.js'

export const DEVICE_VALIDATION = {
  idParam: joi.object({
    id: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID không được để trống',
      'string.hex': 'ID không hợp lệ',
      'string.length': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc'
    }).trim()
  }),
  createDevice: joi.object({
    name: joi.string().max(100).required().messages({
      'string.empty': 'Tên thiết bị không được để trống',
      'any.required': 'Tên thiết bị là bắt buộc',
      'string.max': 'Tên thiết bị không được vượt quá 100 ký tự'
    }).trim(),
    type: joi.string().valid(...Object.values(DEVICE_TYPES)).required().messages({
      'string.empty': 'Loại thiết bị không được để trống',
      'any.required': 'Loại thiết bị là bắt buộc',
      'any.only': `Loại thiết bị phải là một trong các giá trị: ${Object.values(DEVICE_TYPES).join(', ')}`
    }).trim(),
    brand: joi.string().max(100).required().messages({
      'string.empty': 'Thương hiệu không được để trống',
      'any.required': 'Thương hiệu là bắt buộc',
      'string.max': 'Thương hiệu không được vượt quá 100 ký tự'
    }).trim(),
    model: joi.string().max(100).required().messages({
      'string.empty': 'Mẫu mã không được để trống',
      'any.required': 'Mẫu mã là bắt buộc',
      'string.max': 'Mẫu mã không được vượt quá 100 ký tự'
    }).trim()
  }),
  updateDevice: joi.object({
    name: joi.string().max(100).optional().messages({
      'string.empty': 'Tên thiết bị không được để trống',
      'string.max': 'Tên thiết bị không được vượt quá 100 ký tự'
    }).trim(),
    type: joi.string().valid(...Object.values(DEVICE_TYPES)).optional().messages({
      'string.empty': 'Loại thiết bị không được để trống',
      'any.only': `Loại thiết bị phải là một trong các giá trị: ${Object.values(DEVICE_TYPES).join(', ')}`
    }).trim(),
    brand: joi.string().max(100).optional().messages({
      'string.empty': 'Thương hiệu không được để trống',
      'string.max': 'Thương hiệu không được vượt quá 100 ký tự'
    }).trim(),
    model: joi.string().max(100).optional().messages({
      'string.empty': 'Mẫu mã không được để trống',
      'string.max': 'Mẫu mã không được vượt quá 100 ký tự'
    }).trim()
  }),
  updateDeviceStatus: joi.object({
    isActive: joi.boolean().required().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean',
      'any.required': 'Trạng thái hoạt động là bắt buộc'
    })
  }),
  query: joi.object({
    page: joi.number().integer().min(1).default(1).messages({
      'number.base': 'Trang phải là số',
      'number.integer': 'Trang phải là số nguyên',
      'number.min': 'Trang phải lớn hơn hoặc bằng 1'
    }),
    limit: joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Giới hạn phải là số',
      'number.integer': 'Giới hạn phải là số nguyên',
      'number.min': 'Giới hạn phải lớn hơn hoặc bằng 1',
      'number.max': 'Giới hạn không được vượt quá 100'
    }),
    search: joi.string().allow('').messages({
      'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
    }).trim(),
    isActive: joi.boolean().optional().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean'
    }),
    sortBy: joi.string().valid('name', 'createdAt', 'updatedAt').messages({
      'string.base': 'Sắp xếp theo phải là chuỗi',
      'any.only': 'Sắp xếp theo phải là một trong các giá trị: name, createdAt, updatedAt'
    }),
    sortOrder: joi.string().valid('asc', 'desc').default('desc').messages({
      'string.base': 'Thứ tự sắp xếp phải là chuỗi',
      'any.only': 'Thứ tự sắp xếp phải là "asc" hoặc "desc"'
    })
  })
}

export const DEVICE_FIELD_CREATE = GENERATE_UTILS.extractFieldsFromJoi(
  DEVICE_VALIDATION.createDevice
)

export const REQUIRE_FIELD_CREATE_DEVICE = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  DEVICE_VALIDATION.createDevice
)

export const DEVICE_FIELD_UPDATE = GENERATE_UTILS.extractFieldsFromJoi(
  DEVICE_VALIDATION.updateDevice
)

export const DEVICE_FIELD_UPDATE_STATUS = GENERATE_UTILS.extractFieldsFromJoi(
  DEVICE_VALIDATION.updateDeviceStatus
)

export const DEVICE_FIELD_QUERY = GENERATE_UTILS.extractFieldsFromJoi(
  DEVICE_VALIDATION.query
)