import joi from 'joi'

export const STORE_INVENTORY_VALIDATION = {
  branchIdParam: joi.object({
    branchId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID chi nhánh không được để trống',
      'string.hex': 'ID chi nhánh không hợp lệ',
      'string.length': 'ID chi nhánh không hợp lệ',
      'any.required': 'ID chi nhánh là bắt buộc'
    }).trim()
  }),
  branchAndProductIdParam: joi.object({
    branchId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID chi nhánh không được để trống',
      'string.hex': 'ID chi nhánh không hợp lệ',
      'string.length': 'ID chi nhánh không hợp lệ',
      'any.required': 'ID chi nhánh là bắt buộc'
    }).trim(),
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim()
  }),
  createStoreInventory: joi.object({
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
    quantity: joi.number().integer().min(0).optional().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 0'
    })
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
    sortBy: joi.string().valid('quantity', 'createdAt').optional().messages({
      'any.only': 'Trường sắp xếp không hợp lệ'
    }).trim(),
    sortOrder: joi.string().valid('asc', 'desc').optional().messages({
      'any.only': 'Thứ tự sắp xếp không hợp lệ'
    }).trim()
  })
}
