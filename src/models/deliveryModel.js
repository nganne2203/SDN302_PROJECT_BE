import mongoose from 'mongoose'
import { DELIVERY_STATUS } from '#constants/deliveryConstant.js'

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'orders', required: true, unique: true },
    providerName: { type: String, required: true },
    trackingCode: { type: String, required: true, unique: true },
    status: { type: String, enum: Object.values(DELIVERY_STATUS), required: true },
    estimatedDeliveryDate: { type: Date },
    deliveredAt: { type: Date },
    recipientName: { type: String }
  },
  { timestamps: true, versionKey: false }
)

export const deliveryModel = mongoose.model('deliveries', deliverySchema)