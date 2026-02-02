import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

branchSchema.index({ name: 1 })
branchSchema.index({ manager: 1 })

branchSchema.plugin(mongoosePaginate)

export const branchModel = mongoose.model('branches', branchSchema)
