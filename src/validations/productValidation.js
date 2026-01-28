import joi from 'joi'

export const PRODUCT_VALIDATION = {
  idParam: joi.object({
    id: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID không được để trống',
      'string.hex': 'ID không hợp lệ',
      'string.length': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc'
    }).trim()
  }),
  createProduct: joi.object({
    name: joi.string().required().max(200).messages({
      'string.empty': 'Tên sản phẩm không được để trống',
      'any.required': 'Tên sản phẩm là bắt buộc',
      'string.max': 'Tên sản phẩm không được vượt quá 200 ký tự'
    }).trim(),
    description: joi.string().optional().allow('').trim(),
    categoryId: joi.string().hex().length(24).required().messages({
      'string.empty': 'Danh mục không được để trống',
      'string.hex': 'Danh mục không hợp lệ',
      'string.length': 'Danh mục không hợp lệ',
      'any.required': 'Danh mục là bắt buộc'
    }).trim(),
    price: joi.number().positive().required().messages({
      'number.base': 'Giá sản phẩm phải là số',
      'number.positive': 'Giá sản phẩm phải lớn hơn 0',
      'any.required': 'Giá sản phẩm là bắt buộc'
    }),
    images: joi.array().items(
      joi.string().uri().messages({
        'string.uri': 'Ảnh sản phẩm phải là URL hợp lệ'
      })
    ).default([]),
    material: joi.string().optional().allow('').trim(),
    compatibility: joi.array().items(
      joi.string().hex().length(24).messages({
        'string.hex': 'Thiết bị tương thích không hợp lệ',
        'string.length': 'Thiết bị tương thích không hợp lệ'
      })
    ).default([])
  }),
  updateProduct: joi.object({
    name: joi.string().optional().max(200).messages({
      'string.empty': 'Tên sản phẩm không được để trống',
      'string.max': 'Tên sản phẩm không được vượt quá 200 ký tự'
    }).trim(),
    description: joi.string().optional().allow('').trim(),
    categoryId: joi.string().hex().length(24).messages({
      'string.hex': 'Danh mục không hợp lệ',
      'string.length': 'Danh mục không hợp lệ'
    }).trim(),
    price: joi.number().positive().messages({
      'number.base': 'Giá sản phẩm phải là số',
      'number.positive': 'Giá sản phẩm phải lớn hơn 0'
    }),
    images: joi.array().items(
      joi.string().uri().messages({
        'string.uri': 'Ảnh sản phẩm phải là URL hợp lệ'
      })
    ),
    material: joi.string().optional().allow('').trim(),
    compatibility: joi.array().items(
      joi.string().hex().length(24).messages({
        'string.hex': 'Thiết bị tương thích không hợp lệ',
        'string.length': 'Thiết bị tương thích không hợp lệ'
      })
    )
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
    categoryId: joi.string().hex().length(24).messages({
      'string.hex': 'Danh mục không hợp lệ',
      'string.length': 'Danh mục không hợp lệ'
    }).trim(),
    minPrice: joi.number().min(0).messages({
      'number.base': 'Giá tối thiểu phải là số',
      'number.min': 'Giá tối thiểu phải lớn hơn hoặc bằng 0'
    }),
    maxPrice: joi.number().min(0).messages({
      'number.base': 'Giá tối đa phải là số',
      'number.min': 'Giá tối đa phải lớn hơn hoặc bằng 0'
    }),
    isActive: joi.boolean().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean'
    }),
    sortBy: joi.string().valid('name', 'price', 'createdAt', 'updatedAt', 'ratingAvg', 'ratingCount').messages({
      'string.base': 'Sắp xếp theo phải là chuỗi',
      'any.only': 'Sắp xếp theo không hợp lệ'
    }),
    sortOrder: joi.string().valid('asc', 'desc').default('desc').messages({
      'string.base': 'Thứ tự sắp xếp phải là chuỗi',
      'any.only': 'Thứ tự sắp xếp phải là "asc" hoặc "desc"'
    })
  }),
  searchQuery: joi.object({
    q: joi.string().required().messages({
      'string.empty': 'Từ khóa tìm kiếm không được để trống',
      'any.required': 'Từ khóa tìm kiếm là bắt buộc'
    }).trim(),
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
    sortBy: joi.string().valid('name', 'price', 'createdAt', 'updatedAt', 'ratingAvg', 'ratingCount').messages({
      'string.base': 'Sắp xếp theo phải là chuỗi',
      'any.only': 'Sắp xếp theo không hợp lệ'
    }),
    sortOrder: joi.string().valid('asc', 'desc').default('desc').messages({
      'string.base': 'Thứ tự sắp xếp phải là chuỗi',
      'any.only': 'Thứ tự sắp xếp phải là "asc" hoặc "desc"'
    })
  }),
  updateProductStatus: joi.object({
    isActive: joi.boolean().required().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean',
      'any.required': 'Trạng thái hoạt động là bắt buộc'
    })
  })
}
