import joi from 'joi'

const serviceIdStringSchema = joi.string().trim().hex().length(24).required().messages({
  'string.base': 'Service ID phải là chuỗi',
  'string.empty': 'Service ID không được để trống',
  'string.hex': 'Service ID không hợp lệ',
  'string.length': 'Service ID không hợp lệ',
  'any.required': 'Service ID là bắt buộc'
})

const objectIdStringSchema = (label) =>
  joi.string().trim().hex().length(24).messages({
    'string.base': `${label} phải là chuỗi`,
    'string.empty': `${label} không được để trống`,
    'string.hex': `${label} không hợp lệ`,
    'string.length': `${label} không hợp lệ`
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
    productId: objectIdStringSchema('Product ID').required().messages({
      'any.required': 'Product ID là bắt buộc'
    }),
    quantity: joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      'any.required': 'Số lượng là bắt buộc'
    }),
    services: joi.array().items(serviceInputSchema).optional().default([])
  }),

  updateCartItem: joi.object({
    productId: objectIdStringSchema('Product ID').required().messages({
      'any.required': 'Product ID là bắt buộc'
    }),
    quantity: joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      'any.required': 'Số lượng là bắt buộc'
    })
  }),

  updateCartServices: joi.object({
    itemId: objectIdStringSchema('Item ID'),
    productId: objectIdStringSchema('Product ID'),
    services: joi.array().items(serviceInputSchema).required().messages({
      'any.required': 'Danh sách dịch vụ là bắt buộc'
    })
  }).xor('itemId', 'productId').messages({
    'object.missing': 'Chỉ được gửi 1 trong 2: itemId hoặc productId',
    'object.xor': 'Chỉ được gửi 1 trong 2: itemId hoặc productId'
  }),

  removeCartItem: joi.object({
    itemId: objectIdStringSchema('Item ID'),
    productId: objectIdStringSchema('Product ID')
  }).xor('itemId', 'productId').messages({
    'object.missing': 'Chỉ được gửi 1 trong 2: itemId hoặc productId',
    'object.xor': 'Chỉ được gửi 1 trong 2: itemId hoặc productId'
  })
}
