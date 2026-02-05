import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { RoleEnum } from '#constants/roleConstant.js'
import { USER_PROVIDER } from '#constants/userConstant.js'

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, maxLength: 100 },
    email: { type: String, required: true, unique: true, maxLength: 100 },
    role: { type: String, enum: [...Object.values(RoleEnum)], default: RoleEnum.CUSTOMER },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branches', default: null },
    password: { type: String, default: null, minLength: 6 },
    googleId: { type: String, default: null },
    provider: { type: String, enum: Object.values(USER_PROVIDER), default: USER_PROVIDER.LOCAL },
    phone: { type: String, maxLength: 10 },
    addresses: [
      {
        fullname: { type: String, required: true, maxLength: 100 },
        phone: { type: String, required: true, maxLength: 10 },
        addressLine: { type: String, required: true, maxLength: 200 },
        city: { type: String, required: true, maxLength: 100 },
        district: { type: String, required: true, maxLength: 100 },
        ward: { type: String, required: true, maxLength: 100 },
        isDefault: { type: Boolean, default: false }
      }
    ],
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
  },
  { timestamps: true, versionKey: false }
)

userSchema.plugin(mongoosePaginate)

export const userModel = mongoose.model('users', userSchema)