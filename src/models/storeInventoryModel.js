import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const storeInventorySchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branches', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

storeInventorySchema.plugin(mongoosePaginate)

export const storeInventoryModel = mongoose.model('storeInventories', storeInventorySchema)