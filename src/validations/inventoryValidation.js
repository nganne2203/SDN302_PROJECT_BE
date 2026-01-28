import joi from 'joi'

export const INVENTORY_VALIDATION = {
  productIdParam: joi.object({
    productId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim()
  }),
  inventoryIdParam: joi.object({
    inventoryId: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID tồn kho không được để trống',
      'string.hex': 'ID tồn kho không hợp lệ',
      'string.length': 'ID tồn kho không hợp lệ',
      'any.required': 'ID tồn kho là bắt buộc'
    }).trim()
  }),
  createInventory: joi.object({
    product: joi.string().hex().length(24).required().messages({
      'string.empty': 'ID sản phẩm không được để trống',
      'string.hex': 'ID sản phẩm không hợp lệ',
      'string.length': 'ID sản phẩm không hợp lệ',
      'any.required': 'ID sản phẩm là bắt buộc'
    }).trim(),
    quantity: joi.number().integer().min(0).required().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 0',
      'any.required': 'Số lượng là bắt buộc'
    }),
    location: joi.string().max(200).optional().messages({
      'string.max': 'Vị trí kho không được vượt quá 200 ký tự'
    }).trim()
  }),
  adjustInventory: joi.object({
    quantity: joi.number().integer().required().messages({
      'number.base': 'Số lượng điều chỉnh phải là một số',
      'number.integer': 'Số lượng điều chỉnh phải là số nguyên',
      'any.required': 'Số lượng điều chỉnh là bắt buộc'
    })
  }),
  updateInventory: joi.object({
    quantity: joi.number().integer().min(0).optional().messages({
      'number.base': 'Số lượng phải là một số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn hoặc bằng 0'
    }),
    location: joi.string().max(200).optional().messages({
      'string.max': 'Vị trí kho không được vượt quá 200 ký tự'
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
    threshold: joi.number().integer().min(0).optional().messages({
      'number.base': 'Ngưỡng phải là một số',
      'number.integer': 'Ngưỡng phải là số nguyên',
      'number.min': 'Ngưỡng phải lớn hơn hoặc bằng 0'
    }),
    sortBy: joi.string().valid('quantity', 'createdAt', 'updatedAt').optional().messages({
      'string.base': 'Trường sắp xếp phải là một chuỗi',
      'any.only': 'Trường sắp xếp không hợp lệ'
    }),
    sortOrder: joi.string().valid('asc', 'desc').optional().messages({
      'string.base': 'Thứ tự sắp xếp phải là một chuỗi',
      'any.only': 'Thứ tự sắp xếp không hợp lệ'
    })
  })
}
