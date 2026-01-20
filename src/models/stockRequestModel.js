import mongoose from 'mongoose'
import { STOCK_REQUEST_STATUS } from '#constants/stockRequestConstant.js'

const stockRequestSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branches', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    status: { type: String, enum: Object.values(STOCK_REQUEST_STATUS), default: STOCK_REQUEST_STATUS.PENDING },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

export const stockRequestModel = mongoose.model('stockRequests', stockRequestSchema)
