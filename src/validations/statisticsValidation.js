import joi from 'joi'

const periodEnum = ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'this_year', 'last_year', 'custom', 'all']
const groupByEnum = ['hour', 'day', 'week', 'month', 'year']

export const STATISTICS_VALIDATION = {
  dashboardQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ',
      'date.format': 'Ngày bắt đầu phải có định dạng ISO'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ',
      'date.format': 'Ngày kết thúc phải có định dạng ISO'
    })
  }),

  revenueQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    groupBy: joi.string().valid(...groupByEnum).default('day').messages({
      'any.only': 'Nhóm theo không hợp lệ (hour, day, week, month, year)'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    })
  }),

  orderQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    })
  }),

  productQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    limit: joi.number().integer().min(1).max(50).default(10).messages({
      'number.base': 'Limit phải là số',
      'number.min': 'Limit phải lớn hơn 0',
      'number.max': 'Limit không được vượt quá 50'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    })
  }),

  branchQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    })
  }),

  customerQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    limit: joi.number().integer().min(1).max(50).default(10).messages({
      'number.base': 'Limit phải là số',
      'number.min': 'Limit phải lớn hơn 0',
      'number.max': 'Limit không được vượt quá 50'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    })
  }),

  paymentQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    })
  }),

  inventoryQuery: joi.object({
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    })
  }),

  comparisonQuery: joi.object({
    currentPeriod: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian hiện tại không hợp lệ'
    }),
    previousPeriod: joi.string().valid(...periodEnum).default('last_month').messages({
      'any.only': 'Khoảng thời gian trước đó không hợp lệ'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    })
  }),

  periodQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    }),
    limit: joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Limit phải là số',
      'number.min': 'Limit phải lớn hơn 0'
    })
  }),

  paginationQuery: joi.object({
    period: joi.string().valid(...periodEnum).default('this_month').messages({
      'any.only': 'Khoảng thời gian không hợp lệ'
    }),
    branchId: joi.string().hex().length(24).optional().messages({
      'string.hex': 'Branch ID không hợp lệ',
      'string.length': 'Branch ID không hợp lệ'
    }),
    startDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: joi.date().iso().optional().messages({
      'date.base': 'Ngày kết thúc không hợp lệ'
    }),
    limit: joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit phải là số',
      'number.min': 'Limit phải lớn hơn 0',
      'number.max': 'Limit không được vượt quá 100'
    }),
    page: joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page phải là số',
      'number.min': 'Page phải lớn hơn hoặc bằng 1'
    })
  })
}
