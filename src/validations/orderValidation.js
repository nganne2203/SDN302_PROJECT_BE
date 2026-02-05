import joi from 'joi'

export const ORDER_VALIDATION = {
  orderIdParam: joi.object({
    orderId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Order ID không được để trống',
      'string.hex': 'Order ID không hợp lệ',
      'string.length': 'Order ID không hợp lệ',
      'any.required': 'Order ID là bắt buộc'
    })
  }),
  orderParam: joi.object({
    orderNumber: joi.string().hex().length(36).required().messages({
      'string.empty': 'Order number không được để trống',
      'string.hex': 'Order number không hợp lệ',
      'string.length': 'Order number không hợp lệ',
      'any.required': 'Order number là bắt buộc'
    })
  }),
  createOrder: joi.object({
    type: joi.string().valid('online', 'offline').optional().default('online').messages({
      'any.only': 'Loại đơn hàng không hợp lệ (online, offline)'
    }),
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
    }).when('type', {
      is: 'online',
      then: joi.required().messages({
        'any.required': 'Địa chỉ giao hàng là bắt buộc cho đơn hàng online'
      }),
      otherwise: joi.optional().allow(null)
    }),
    paymentMethod: joi.string().valid('cod', 'bank_transfer', 'vnpay').required().messages({
      'string.empty': 'Phương thức thanh toán không được để trống',
      'any.only': 'Phương thức thanh toán không hợp lệ (cod, bank_transfer, vnpay)',
      'any.required': 'Phương thức thanh toán là bắt buộc'
    }),
    message: joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    }),
    branchId: joi.string().hex().length(24).when('type', {
      is: 'offline',
      then: joi.required().messages({
        'any.required': 'Branch ID là bắt buộc cho đơn hàng offline'
      }),
      otherwise: joi.optional().allow(null)
    }).messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    customerId: joi.string().hex().length(24).when('type', {
      is: 'offline',
      then: joi.optional().allow(null),
      otherwise: joi.forbidden()
    }).messages({
      'string.hex': 'Customer ID không hợp lệ',
      'string.length': 'Customer ID không hợp lệ',
      'any.unknown': 'Customer ID chỉ được sử dụng cho đơn hàng offline'
    })
  }),

  createOfflineOrder: joi.object({
    type: joi.string().valid('offline').required().messages({
      'any.only': 'Loại đơn hàng phải là offline',
      'any.required': 'Loại đơn hàng là bắt buộc'
    }),
    customerId: joi.string().hex().length(24).optional().allow(null).messages({
      'string.hex': 'Customer ID không hợp lệ',
      'string.length': 'Customer ID không hợp lệ'
    }),
    items: joi.array().min(1).items(
      joi.object({
        product: joi.string().hex().length(24).required().messages({
          'string.empty': 'Product ID không được để trống',
          'any.required': 'Product ID là bắt buộc'
        }),
        quantity: joi.number().integer().min(1).required().messages({
          'number.base': 'Số lượng phải là số',
          'number.min': 'Số lượng phải lớn hơn 0',
          'any.required': 'Số lượng là bắt buộc'
        }),
        services: joi.array().items(
          joi.string().hex().length(24).messages({
            'string.hex': 'Service ID không hợp lệ',
            'string.length': 'Service ID không hợp lệ'
          })
        ).optional()
      })
    ).required().messages({
      'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm',
      'any.required': 'Danh sách sản phẩm là bắt buộc'
    }),
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
    }).optional().allow(null),
    paymentMethod: joi.string().valid('cod', 'cash', 'bank_transfer', 'vnpay').required().messages({
      'string.empty': 'Phương thức thanh toán không được để trống',
      'any.only': 'Phương thức thanh toán không hợp lệ',
      'any.required': 'Phương thức thanh toán là bắt buộc'
    }),
    message: joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    }),
    branchId: joi.string().hex().length(24).required().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ',
      'any.required': 'Branch ID là bắt buộc'
    }),
    hasDelivery: joi.boolean().optional().default(false)
  }),

  updateOrderStatus: joi.object({
    status: joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'canceled').required().messages({
      'string.empty': 'Trạng thái đơn hàng không được để trống',
      'any.only': 'Trạng thái không hợp lệ',
      'any.required': 'Trạng thái đơn hàng là bắt buộc'
    })
  }),

  cancelOrder: joi.object({
    cancelReason: joi.string().trim().min(10).max(500).required().messages({
      'string.empty': 'Lý do hủy không được để trống',
      'string.min': 'Lý do hủy phải có ít nhất 10 ký tự',
      'string.max': 'Lý do hủy không được vượt quá 500 ký tự',
      'any.required': 'Lý do hủy là bắt buộc'
    })
  }),

  updateDeliveryInfo: joi.object({
    providerName: joi.string().trim().optional().allow(''),
    trackingCode: joi.string().trim().optional().allow(''),
    status: joi.string().valid('pending', 'shipping', 'delivered', 'cancelled', 'failed').optional(),
    estimatedDeliveryDate: joi.date().optional().allow(null),
    deliveredAt: joi.date().optional().allow(null),
    recipientName: joi.string().trim().optional().allow('')
  }),

  getOrders: joi.object({
    page: joi.number().integer().min(1).optional().default(1),
    limit: joi.number().integer().min(1).max(100).optional().default(10),
    status: joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'canceled').optional(),
    sortBy: joi.string().valid('createdAt', 'totalAmount', 'orderNumber').optional().default('createdAt'),
    sortOrder: joi.string().valid('asc', 'desc').optional().default('desc')
  })
}
