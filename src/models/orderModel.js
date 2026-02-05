import mongoose from 'mongoose'
import { ORDER_STATUS, DELIVERY_STATUS, ORDER_TYPE } from '#constants/orderConstant.js'
import { PAYMENT_METHODS } from '#constants/paymentConstant.js'
import mongoosePaginate from 'mongoose-paginate-v2'

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: Object.values(ORDER_TYPE), default: ORDER_TYPE.ONLINE },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        services: [
          {
            service: { type: mongoose.Schema.Types.ObjectId, ref: 'services' },
            price: { type: Number, required: true }
          }
        ]
      }
    ],
    shippingAddress: {
      fullname: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      ward: { type: String, required: true }
    },
    orderStatus: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    pricingApplied: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        minQuantity: { type: Number, default: 0 },
        maxQuantity: { type: Number, default: null },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 }
      }
    ],
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    delivery: {
      providerName: { type: String, default: '' },
      trackingCode: { type: String, default: '' },
      status: { type: String, enum: Object.values(DELIVERY_STATUS), default: DELIVERY_STATUS.PENDING },
      estimatedDeliveryDate: { type: Date },
      deliveredAt: { type: Date },
      recipientName: { type: String, default: '' }
    },
    cancelReason: { type: String, default: '' },
    message: { type: String, default: '' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'branches', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

orderSchema.plugin(mongoosePaginate)

export const orderModel = mongoose.model('orders', orderSchema)