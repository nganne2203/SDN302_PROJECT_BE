import mongoose from 'mongoose'
import { PAYMENT_PROVIDERS, PAYMENT_STATUS, PAYMENT_METHODS } from '#constants/paymentConstant.js'

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'orders', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    provider: { type: String, enum: Object.values(PAYMENT_PROVIDERS), required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'VND' },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), required: true },
    transactionId: { type: String, required: true, unique: true },
    paymentUrl: { type: String, default: '' },
    responseData: { type: mongoose.Schema.Types.Mixed, default: {} },
    vnp_TxnRef: { type: String, default: '' },
    vnp_BankCode: { type: String, default: '' },
    vnp_ResponseCode: { type: String, default: '' },
    vnp_TransactionNo: { type: String, default: '' },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    failureReason: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
)

export const paymentModel = mongoose.model('payments', paymentSchema)
