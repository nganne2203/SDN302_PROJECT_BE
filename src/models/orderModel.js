import mongoose from 'mongoose'
import { ORDER_STATUS } from '#constants/orderConstant.js'
import { PAYMENT_METHODS } from '#constants/paymentConstant.js'

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }
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
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'promotions' }, // Reference đến promotion được áp dụng
    discountCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    cancelReason: { type: String, default: '' }, // Lý do hủy đơn
    message: { type: String, default: '' }, // Ghi chú từ khách hàng
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true, versionKey: false }
)

export const orderModel = mongoose.model('orders', orderSchema)