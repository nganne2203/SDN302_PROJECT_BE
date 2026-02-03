import joi from 'joi'

export const REVIEW_VALIDATION = {
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
  createReview: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim(),
    rating: joi.number().integer().min(1).max(5).required().messages({
      'number.base': 'Đánh giá phải là số',
      'number.integer': 'Đánh giá phải là số nguyên',
      'number.min': 'Đánh giá phải từ 1 đến 5 sao',
      'number.max': 'Đánh giá phải từ 1 đến 5 sao',
      'any.required': 'Đánh giá là bắt buộc'
    }),
    comment: joi.string().optional().allow('').max(1000).messages({
      'string.max': 'Nhận xét không được vượt quá 1000 ký tự'
    }).trim(),
    images: joi.array().items(
      joi.string().uri().messages({
        'string.uri': 'URL ảnh không hợp lệ'
      })
    ).max(5).default([]).messages({
      'array.max': 'Chỉ được upload tối đa 5 ảnh'
    })
  }),
  updateReview: joi.object({
    rating: joi.number().integer().min(1).max(5).optional().messages({
      'number.base': 'Đánh giá phải là số',
      'number.integer': 'Đánh giá phải là số nguyên',
      'number.min': 'Đánh giá phải từ 1 đến 5 sao',
      'number.max': 'Đánh giá phải từ 1 đến 5 sao'
    }),
    comment: joi.string().optional().allow('').max(1000).messages({
      'string.max': 'Nhận xét không được vượt quá 1000 ký tự'
    }).trim(),
    images: joi.array().items(
      joi.string().uri().messages({
        'string.uri': 'URL ảnh không hợp lệ'
      })
    ).max(5).optional().messages({
      'array.max': 'Chỉ được upload tối đa 5 ảnh'
    })
  }),
  getReviews: joi.object({
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
    rating: joi.number().integer().min(1).max(5).optional().messages({
      'number.base': 'Đánh giá phải là số',
      'number.integer': 'Đánh giá phải là số nguyên',
      'number.min': 'Đánh giá phải từ 1 đến 5 sao',
      'number.max': 'Đánh giá phải từ 1 đến 5 sao'
    }),
    productId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ'
    }).trim(),
    sortBy: joi.string().valid('createdAt', 'rating').default('createdAt').messages({
      'any.only': 'Sắp xếp theo phải là createdAt hoặc rating'
    }),
    sortOrder: joi.string().valid('asc', 'desc').default('desc').messages({
      'any.only': 'Thứ tự sắp xếp phải là asc hoặc desc'
    })
  })
}
