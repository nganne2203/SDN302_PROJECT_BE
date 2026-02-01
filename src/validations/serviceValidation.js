import joi from 'joi'
import { SERVICE_TYPES } from '#constants/serviceType.js'

export const SERVICE_VALIDATION = {
  idParam: joi.object({
    id: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID không được để trống',
      'string.hex': 'ID không hợp lệ',
      'string.length': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc'
    }).trim()
  }),
  productIdParam: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim()
  }),
  createService: joi.object({
    product: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim(),
    name: joi.string().required().max(100).messages({
      'string.empty': 'Tên dịch vụ không được để trống',
      'any.required': 'Tên dịch vụ là bắt buộc',
      'string.max': 'Tên dịch vụ không được vượt quá 100 ký tự'
    }).trim(),
    description: joi.string().optional().allow('').trim(),
    type: joi.string().valid(...Object.values(SERVICE_TYPES)).required().messages({
      'string.empty': 'Loại dịch vụ không được để trống',
      'any.required': 'Loại dịch vụ là bắt buộc',
      'any.only': 'Loại dịch vụ không hợp lệ'
    }).trim(),
    price: joi.number().required().min(0).messages({
      'number.base': 'Giá dịch vụ phải là số',
      'any.required': 'Giá dịch vụ là bắt buộc',
      'number.min': 'Giá dịch vụ không được nhỏ hơn 0'
    })
  }),
  updateService: joi.object({
    name: joi.string().optional().max(100).messages({
      'string.empty': 'Tên dịch vụ không được để trống',
      'string.max': 'Tên dịch vụ không được vượt quá 100 ký tự'
    }).trim(),
    description: joi.string().optional().allow('').trim(),
    type: joi.string().valid(...Object.values(SERVICE_TYPES)).optional().messages({
      'string.empty': 'Loại dịch vụ không được để trống',
      'any.only': 'Loại dịch vụ không hợp lệ'
    }).trim(),
    price: joi.number().optional().min(0).messages({
      'number.base': 'Giá dịch vụ phải là số',
      'number.min': 'Giá dịch vụ không được nhỏ hơn 0'
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
    sortBy: joi.string().valid('name', 'price', 'type', 'createdAt', 'updatedAt').messages({
      'string.base': 'Sắp xếp theo phải là chuỗi',
      'any.only': 'Sắp xếp theo phải là một trong các giá trị: name, price, createdAt, updatedAt'
    }),
    sortOrder: joi.string().valid('asc', 'desc').default('desc').messages({
      'string.base': 'Thứ tự sắp xếp phải là chuỗi',
      'any.only': 'Thứ tự sắp xếp phải là "asc" hoặc "desc"'
    }),
    isActive: joi.boolean().optional().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean'
    })
  }),
  updateServiceStatus: joi.object({
    isActive: joi.boolean().required().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean',
      'any.required': 'Trạng thái hoạt động là bắt buộc'
    })
  })
}