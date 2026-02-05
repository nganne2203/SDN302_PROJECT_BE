import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
    price: { type: Number, required: true },
    images: { type: [String], default: [] },
    material: { type: String, default: '' },
    compatibility: [{ type: mongoose.Schema.Types.ObjectId, ref: 'devices' }],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  {
    timestamps: true, versionKey: false
  }
)

productSchema.plugin(mongoosePaginate)

export const productModel = mongoose.model('products', productSchema)