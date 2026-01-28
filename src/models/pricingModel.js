import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const pricingSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    minQuantity: { type: Number, required: true }, // Số lượng tối thiểu
    maxQuantity: { type: Number, default: null }, // Số lượng tối đa (null = không giới hạn)
    pricePerUnit: { type: Number, required: true }, // Giá từng đơn vị
    discountPercentage: { type: Number, default: 0 }, // Chiết khấu theo phần trăm
    description: { type: String, default: '' }, // Mô tả về mức giá
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

pricingSchema.plugin(mongoosePaginate)

export const pricingModel = mongoose.model('pricings', pricingSchema)
