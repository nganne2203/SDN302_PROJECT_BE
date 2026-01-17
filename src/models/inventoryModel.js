import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    location: { type: String, default: '' }, // optional: kho lưu trữ
    history: [
      {
        type: { type: String, enum: ['import', 'export', 'adjust'], required: true },
        quantity: { type: Number, required: true },
        note: { type: String, default: '' },
        date: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
      }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)
inventorySchema.plugin(mongoosePaginate)

export const inventoryModel = mongoose.model('inventories', inventorySchema)