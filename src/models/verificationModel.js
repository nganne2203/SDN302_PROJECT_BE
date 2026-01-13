import mongoose from 'mongoose'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

const verificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: Object.values(VERIFY_TYPE),
      required: true,
    },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date },
    attempts: { type: Number, default: 0 },
  }, 
  { timestamps: true, versionKey: false }
)

export const VerificationModel = mongoose.model('verifications', verificationSchema)