import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    location: { type: String, default: '' }, // optional: kho lưu trữ
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

inventorySchema.plugin(mongoosePaginate)

export const inventoryModel = mongoose.model('inventories', inventorySchema)