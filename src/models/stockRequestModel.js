import mongoose from 'mongoose'
import { STOCK_REQUEST_STATUS } from '#constants/stockRequestConstant.js'
import mongoosePaginate from 'mongoose-paginate-v2'

const stockRequestSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branches', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: Object.values(STOCK_REQUEST_STATUS), default: STOCK_REQUEST_STATUS.PENDING },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    note: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
)

stockRequestSchema.plugin(mongoosePaginate)

export const stockRequestModel = mongoose.model('stockRequests', stockRequestSchema)
