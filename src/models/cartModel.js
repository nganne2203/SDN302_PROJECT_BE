import mongoose from 'mongoose'

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }
      }
    ],
    totalPrice: { type: Number, required: true, default: 0 }
  },
  {
    timestamps: true, versionKey: false
  }
)

export const cartModel = mongoose.model('carts', cartSchema)