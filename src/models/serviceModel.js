import mongoose from 'mongoose'
import { SERVICE_TYPES } from '#constants/serviceConstant.js'

const serviceSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    name: { type: String, required: true }, // Ví dụ: Khắc tên, In ảnh, Đục lỗ, v.v
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: Object.values(SERVICE_TYPES) }, // Ví dụ: ENGRAVING, PRINTING, DRILLING, v.v
    price: { type: Number, required: true }, // Giá của dịch vụ
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

export const serviceModel = mongoose.model('services', serviceSchema)
