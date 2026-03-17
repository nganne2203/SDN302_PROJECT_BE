import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '#constants/pattern.js'

const createPricing = {
  body: Joi.object({
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    minQuantity: Joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng tối thiểu phải là một số nguyên',
      'number.min': 'Số lượng tối thiểu phải lớn hơn hoặc bằng 1',
      'any.required': 'Số lượng tối thiểu là bắt buộc'
    }),
    maxQuantity: Joi.number().integer().min(1).allow(null).optional().messages({
      'number.base': 'Số lượng tối đa phải là một số nguyên',
      'number.min': 'Số lượng tối đa phải lớn hơn hoặc bằng 1'
    }),
    pricePerUnit: Joi.number().min(0).required().messages({
      'number.base': 'Giá mỗi đơn vị phải là một số',
      'number.min': 'Giá mỗi đơn vị phải lớn hơn hoặc bằng 0',
      'any.required': 'Giá mỗi đơn vị là bắt buộc'
    }),
    discountPercentage: Joi.number().min(0).max(100).optional().messages({
      'number.base': 'Phần trăm giảm giá phải là một số',
      'number.min': 'Phần trăm giảm giá phải lớn hơn hoặc bằng 0',
      'number.max': 'Phần trăm giảm giá phải nhỏ hơn hoặc bằng 100'
    }),
    description: Joi.string().max(500).allow('').optional()
  })
}

const createBulkPricings = {
  body: Joi.object({
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    tiers: Joi.array()
      .items(
        Joi.object({
          minQuantity: Joi.number().integer().min(1).required().messages({
            'number.base': 'Số lượng tối thiểu phải là một số nguyên',
            'number.min': 'Số lượng tối thiểu phải lớn hơn hoặc bằng 1',
            'any.required': 'Số lượng tối thiểu là bắt buộc'
          }),
          maxQuantity: Joi.number().integer().min(1).allow(null).optional().messages({
            'number.base': 'Số lượng tối đa phải là một số nguyên',
            'number.min': 'Số lượng tối đa phải lớn hơn hoặc bằng 1'
          }),
          pricePerUnit: Joi.number().min(0).required().messages({
            'number.base': 'Giá mỗi đơn vị phải là một số',
            'number.min': 'Giá mỗi đơn vị phải lớn hơn hoặc bằng 0',
            'any.required': 'Giá mỗi đơn vị là bắt buộc'
          }),
          discountPercentage: Joi.number().min(0).max(100).optional().messages({
            'number.base': 'Phần trăm giảm giá phải là một số',
            'number.min': 'Phần trăm giảm giá phải lớn hơn hoặc bằng 0',
            'number.max': 'Phần trăm giảm giá phải nhỏ hơn hoặc bằng 100'
          }),
          description: Joi.string().max(500).allow('').optional()
        })
      )
      .min(1)
      .required()
  })
}

const updatePricing = {
  params: Joi.object({
    id: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  }),
  body: Joi.object({
    minQuantity: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Số lượng tối thiểu phải là một số nguyên',
      'number.min': 'Số lượng tối thiểu phải lớn hơn hoặc bằng 1'
    }),
    maxQuantity: Joi.number().integer().min(1).allow(null).optional().messages({
      'number.base': 'Số lượng tối đa phải là một số nguyên',
      'number.min': 'Số lượng tối đa phải lớn hơn hoặc bằng 1'
    }),
    pricePerUnit: Joi.number().min(0).optional().messages({
      'number.base': 'Giá mỗi đơn vị phải là một số',
      'number.min': 'Giá mỗi đơn vị phải lớn hơn hoặc bằng 0'
    }),
    discountPercentage: Joi.number().min(0).max(100).optional().messages({
      'number.base': 'Phần trăm giảm giá phải là một số',
      'number.min': 'Phần trăm giảm giá phải lớn hơn hoặc bằng 0',
      'number.max': 'Phần trăm giảm giá phải nhỏ hơn hoặc bằng 100'
    }),
    description: Joi.string().max(500).allow('').optional(),
    isActive: Joi.boolean().optional()
  }).min(1)
}

const getPricingById = {
  params: Joi.object({
    id: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  })
}

const getPricingsByProduct = {
  params: Joi.object({
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  })
}

const deletePricing = {
  params: Joi.object({
    id: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  })
}

const deleteProductPricings = {
  params: Joi.object({
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  })
}

const calculatePrice = {
  params: Joi.object({
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  }),
  query: Joi.object({
    quantity: Joi.number().integer().min(1).required()
  })
}

const getAllPricings = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().trim().max(255).optional(),
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional(),
    isActive: Joi.boolean().optional()
  })
}

const togglePricingStatus = {
  params: Joi.object({
    id: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required()
  })
}

export const PRICING_VALIDATION = {
  createPricing,
  createBulkPricings,
  updatePricing,
  getPricingById,
  getPricingsByProduct,
  deletePricing,
  deleteProductPricings,
  calculatePrice,
  getAllPricings,
  togglePricingStatus
}
