import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
)

refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ isRevoked: 1 });

export const refreshTokenModel = mongoose.model('refreshTokens', refreshTokenSchema);