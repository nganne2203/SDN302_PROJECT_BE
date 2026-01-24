import mongoose from 'mongoose'
import { DEVICE_TYPES } from '#constants/deviceConstant.js'
import mongoosePaginate from 'mongoose-paginate-v2'

const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, maxLength: 100 },
    type: { type: String, enum: Object.values(DEVICE_TYPES), required: true },
    brand: { type: String, required: true, maxLength: 100 },
    model: { type: String, required: true, maxLength: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  {
    timestamps: true, versionKey: false
  }
)

deviceSchema.plugin(mongoosePaginate)

export const deviceModel = mongoose.model('devices', deviceSchema)