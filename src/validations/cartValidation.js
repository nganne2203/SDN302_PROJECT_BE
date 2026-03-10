import joi from 'joi'

const serviceIdStringSchema = joi.string().trim().hex().length(24).required().messages({
  'string.base': 'Service ID phải là chuỗi',
  'string.empty': 'Service ID không được để trống',
  'string.hex': 'Service ID không hợp lệ',
  'string.length': 'Service ID không hợp lệ',
  'any.required': 'Service ID là bắt buộc'
})

const serviceInputSchema = joi.alternatives().try(
  serviceIdStringSchema,
  joi.object({
    serviceId: serviceIdStringSchema.messages({
      'any.required': 'services[].serviceId là bắt buộc'
    })
  }).required().messages({
    'object.base': 'Mỗi phần tử services phải là object hoặc string ObjectId'
  })
).messages({
  'alternatives.match': 'Mỗi phần tử services phải là object { serviceId } hoặc string ObjectId'
})

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
    services: joi.array().items(serviceInputSchema).optional().default([])
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
    services: joi.array().items(serviceInputSchema).required().messages({
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