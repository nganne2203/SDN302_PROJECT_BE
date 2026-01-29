import joi from 'joi'

export const CART_VALIDATION = {
  addToCart: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Product ID không được để trống',
      'string.hex': 'Product ID không hợp lệ',
      'string.length': 'Product ID không hợp lệ',
      'any.required': 'Product ID là bắt buộc'
    }).trim(),
    quantity: joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      'any.required': 'Số lượng là bắt buộc'
    }),
    services: joi.array().items(
      joi.object({
        serviceId: joi.string().hex().length(24).required().messages({
          'string.empty': 'Service ID không được để trống',
          'string.hex': 'Service ID không hợp lệ',
          'string.length': 'Service ID không hợp lệ',
          'any.required': 'Service ID là bắt buộc'
        }).trim()
      })
    ).optional().default([])
  }),
  updateCartItem: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Product ID không được để trống',
      'string.hex': 'Product ID không hợp lệ',
      'string.length': 'Product ID không hợp lệ',
      'any.required': 'Product ID là bắt buộc'
    }).trim(),
    quantity: joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      'any.required': 'Số lượng là bắt buộc'
    })
  }),
  updateCartServices: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Product ID không được để trống',
      'string.hex': 'Product ID không hợp lệ',
      'string.length': 'Product ID không hợp lệ',
      'any.required': 'Product ID là bắt buộc'
    }).trim(),
    services: joi.array().items(
      joi.object({
        serviceId: joi.string().hex().length(24).required().messages({
          'string.empty': 'Service ID không được để trống',
          'string.hex': 'Service ID không hợp lệ',
          'string.length': 'Service ID không hợp lệ',
          'any.required': 'Service ID là bắt buộc'
        }).trim()
      })
    ).required().messages({
      'any.required': 'Danh sách dịch vụ là bắt buộc'
    })
  }),
  removeCartItem: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Product ID không được để trống',
      'string.hex': 'Product ID không hợp lệ',
      'string.length': 'Product ID không hợp lệ',
      'any.required': 'Product ID là bắt buộc'
    }).trim()
  })
}