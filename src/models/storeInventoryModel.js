import mongoose from 'mongoose'

const storeInventorySchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branches', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, default: 0 }
  },
  { timestamps: true, versionKey: false }
)

export const storeInventoryModel = mongoose.model('storeInventories', storeInventorySchema)