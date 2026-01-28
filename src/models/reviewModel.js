import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    images: [{ type: String }]
  },
  { timestamps: true, versionKey: false }
)

reviewSchema.plugin(mongoosePaginate)

export const reviewModel = mongoose.model('reviews', reviewSchema)