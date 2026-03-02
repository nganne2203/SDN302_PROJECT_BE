import joi from 'joi'

export const PAYMENT_VALIDATION = {
  createVNPayPayment: joi.object({
    shippingAddress: joi.object({
      fullname: joi.string().trim().required().messages({
        'string.empty': 'Tên người nhận không được để trống',
        'any.required': 'Tên người nhận là bắt buộc'
      }),
      phone: joi.string().trim().pattern(/^[0-9]{10,11}$/).required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 chữ số)',
        'any.required': 'Số điện thoại là bắt buộc'
      }),
      addressLine: joi.string().trim().required().messages({
        'string.empty': 'Địa chỉ không được để trống',
        'any.required': 'Địa chỉ là bắt buộc'
      }),
      city: joi.string().trim().required().messages({
        'string.empty': 'Thành phố không được để trống',
        'any.required': 'Thành phố là bắt buộc'
      }),
      district: joi.string().trim().required().messages({
        'string.empty': 'Quận/Huyện không được để trống',
        'any.required': 'Quận/Huyện là bắt buộc'
      }),
      ward: joi.string().trim().required().messages({
        'string.empty': 'Phường/Xã không được để trống',
        'any.required': 'Phường/Xã là bắt buộc'
      })
    }).required().messages({
      'any.required': 'Địa chỉ giao hàng là bắt buộc'
    }),
    message: joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    }),
    bankCode: joi.string().trim().optional().allow('').messages({
      'string.base': 'Mã ngân hàng không hợp lệ'
    }),
    locale: joi.string().valid('vn', 'en').optional().default('vn').messages({
      'any.only': 'Ngôn ngữ không hợp lệ (vn hoặc en)'
    })
  }),

  getMyPayments: joi.object({
    page: joi.number().integer().min(1).optional().default(1),
    limit: joi.number().integer().min(1).max(100).optional().default(10),
    status: joi.string().valid('pending', 'success', 'failed', 'refunded', 'canceled').optional()
  }),

  orderIdParam: joi.object({
    orderId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Order ID không được để trống',
      'string.hex': 'Order ID không hợp lệ',
      'string.length': 'Order ID không hợp lệ',
      'any.required': 'Order ID là bắt buộc'
    })
  }),

  orderNumberParam: joi.object({
    orderNumber: joi.string().trim().required().messages({
      'string.empty': 'Mã đơn hàng không được để trống',
      'any.required': 'Mã đơn hàng là bắt buộc'
    })
  })
}
