import joi from 'joi'

export const CATEGORY_VALIDATION = {
  idParam: joi.object({
    id: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID không được để trống',
      'string.hex': 'ID không hợp lệ',
      'string.length': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc'
    }).trim()
  }),
  createCategory: joi.object({
    name: joi.string().required().messages({
      'string.empty': 'Tên danh mục không được để trống',
      'any.required': 'Tên danh mục là bắt buộc'
    }).trim(),
    description: joi.string().optional().allow('').trim()
  }),
  updateCategory: joi.object({
    name: joi.string().optional().messages({
      'string.empty': 'Tên danh mục không được để trống'
    }).trim(),
    description: joi.string().optional().allow('').trim()
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
    sortBy: joi.string().valid('name', 'createdAt', 'updatedAt').messages({
      'string.base': 'Sắp xếp theo phải là chuỗi',
      'any.only': 'Sắp xếp theo phải là một trong các giá trị: name, createdAt, updatedAt'
    }),
    sortOrder: joi.string().valid('asc', 'desc').default('desc').messages({
      'string.base': 'Thứ tự sắp xếp phải là chuỗi',
      'any.only': 'Thứ tự sắp xếp phải là "asc" hoặc "desc"'
    })
  }),
  updateCategoryStatus: joi.object({
    isActive: joi.boolean().required().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean',
      'any.required': 'Trạng thái hoạt động là bắt buộc'
    })
  })
}
