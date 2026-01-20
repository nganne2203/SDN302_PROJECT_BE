import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { RoleEnum, USER_PROVIDER } from '#constants/userConstant.js'

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: [...Object.values(RoleEnum)], default: RoleEnum.CUSTOMER },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branchs', default: null },
    password: { type: String, default: null },
    googleId: { type: String, default: null },
    provider: { type: String, enum: Object.values(USER_PROVIDER), default: USER_PROVIDER.LOCAL },
    phone: { type: String, maxLength: 10 },
    addresses: [
      {
        fullname: { type: String, required: true },
        phone: { type: String, required: true, maxLength: 10 },
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        ward: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
      }
    ],
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
  },
  { timestamps: true, versionKey: false }
)

userSchema.plugin(mongoosePaginate)

export const userModel = mongoose.model('users', userSchema)