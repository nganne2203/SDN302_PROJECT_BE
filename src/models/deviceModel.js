import mongoose from 'mongoose'
import { DEVICE_TYPES } from '#constants/deviceConstant.js'
const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: Object.values(DEVICE_TYPES), required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true }
  },
  {
    timestamps: true, versionKey: false
  }
)

export const deviceModel = mongoose.model('devices', deviceSchema)