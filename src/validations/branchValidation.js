import joi from 'joi'

export const BRANCH_VALIDATION = {
  idParam: joi.object({
    id: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID không được để trống',
      'string.hex': 'ID không hợp lệ',
      'string.length': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc'
    }).trim()
  }),
  createBranch: joi.object({
    name: joi.string().required().messages({
      'string.empty': 'Tên chi nhánh không được để trống',
      'any.required': 'Tên chi nhánh là bắt buộc'
    }).trim(),
    address: joi.string().required().messages({
      'string.empty': 'Địa chỉ chi nhánh không được để trống',
      'any.required': 'Địa chỉ chi nhánh là bắt buộc'
    }).trim(),
    manager: joi.string().optional().hex().length(24).messages({
      'string.hex': 'ID quản lý không hợp lệ',
      'string.length': 'ID quản lý không hợp lệ'
    }).trim()
  }),
  updateBranch: joi.object({
    name: joi.string().optional().messages({
      'string.empty': 'Tên chi nhánh không được để trống'
    }).trim(),
    address: joi.string().optional().messages({
      'string.empty': 'Địa chỉ chi nhánh không được để trống'
    }).trim(),
    manager: joi.string().optional().hex().length(24).messages({
      'string.hex': 'ID quản lý không hợp lệ',
      'string.length': 'ID quản lý không hợp lệ'
    }).trim()
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
    }),
    isActive: joi.boolean().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean'
    })
  }),
  assignManager: joi.object({
    manager: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID quản lý không được để trống',
      'string.hex': 'ID quản lý không hợp lệ',
      'string.length': 'ID quản lý không hợp lệ',
      'any.required': 'ID quản lý là bắt buộc'
    }).trim()
  }),
  updateBranchStatus: joi.object({
    isActive: joi.boolean().required().messages({
      'boolean.base': 'Trạng thái hoạt động phải là giá trị boolean',
      'any.required': 'Trạng thái hoạt động là bắt buộc'
    })
  })
}