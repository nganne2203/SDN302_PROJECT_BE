import joi from 'joi'

export const STOCK_REQUEST_VALIDATION = {
  requestIdParam: joi.object({
    requestId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID yêu cầu không được để trống',
      'string.hex': 'ID yêu cầu không hợp lệ',
      'string.length': 'ID yêu cầu không hợp lệ',
      'any.required': 'ID yêu cầu là bắt buộc'
    }).trim()
  }),
  branchIdParam: joi.object({
    branchId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID chi nhánh không được để trống',
      'string.hex': 'ID chi nhánh không hợp lệ',
      'string.length': 'ID chi nhánh không hợp lệ',
      'any.required': 'ID chi nhánh là bắt buộc'
    }).trim()
  }),
  createStockRequest: joi.object({
    branch: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID chi nhánh không được để trống',
      'string.hex': 'ID chi nhánh không hợp lệ',
      'string.length': 'ID chi nhánh không hợp lệ',
      'any.required': 'ID chi nhánh là bắt buộc'
    }).trim(),
    product: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim(),
    quantity: joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      'any.required': 'Số lượng là bắt buộc'
    }),
    reason: joi.string().max(500).optional().messages({
      'string.max': 'Lý do yêu cầu không được vượt quá 500 ký tự'
    }).trim()
  }),
  approveStockRequest: joi.object({
    note: joi.string().max(500).optional().messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    }).trim()
  }),
  rejectStockRequest: joi.object({
    note: joi.string().max(500).required().messages({
      'string.empty': 'Ghi chú từ chối không được để trống',
      'string.max': 'Ghi chú từ chối không được vượt quá 500 ký tự',
      'any.required': 'Ghi chú từ chối là bắt buộc'
    }).trim()
  }),
  query: joi.object({
    page: joi.number().integer().min(1).optional().messages({
      'number.base': 'Số trang phải là một số',
      'number.integer': 'Số trang phải là số nguyên',
      'number.min': 'Số trang phải lớn hơn hoặc bằng 1'
    }),
    limit: joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Giới hạn phải là một số',
      'number.integer': 'Giới hạn phải là số nguyên',
      'number.min': 'Giới hạn phải lớn hơn hoặc bằng 1',
      'number.max': 'Giới hạn không được vượt quá 100'
    }),
    sortBy: joi.string().valid('createdAt', 'quantity', 'status').optional().messages({
      'any.only': 'Trường sắp xếp không hợp lệ'
    }).trim(),
    sortOrder: joi.string().valid('asc', 'desc').optional().messages({
      'any.only': 'Thứ tự sắp xếp không hợp lệ'
    }).trim(),
    status: joi.string().valid('pending', 'approved', 'rejected').optional().messages({
      'any.only': 'Trạng thái phải là một trong các giá trị: pending, approved, rejected'
    }).trim()
  })
}
