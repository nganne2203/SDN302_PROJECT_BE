import mongoose from 'mongoose'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

const verificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(VERIFY_TYPE),
      required: true
    },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verified: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true, versionKey: false }
)

verificationSchema.index({ user: 1, type: 1, verified: 1 })

export const verificationModel = mongoose.model('verifications', verificationSchema)