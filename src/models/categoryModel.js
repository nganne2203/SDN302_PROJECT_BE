import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, maxLength: 100 },
    description: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, maxLength: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  {
    timestamps: true, versionKey: false
  }
)

categorySchema.plugin(mongoosePaginate)

export const categoryModel = mongoose.model('categories', categorySchema)
