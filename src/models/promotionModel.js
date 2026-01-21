import mongoose from 'mongoose'
import { PROMOTION_TYPES } from '#constants/promotionConstant.js'

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    type: { type: String, enum: Object.values(PROMOTION_TYPES), required: true },
    discountValue: { type: Number, required: true },
    minPurchaseValue: { type: Number, default: 0 },
    maxUsage: { type: Number, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

export const promotionModel = mongoose.model('promotions', promotionSchema)