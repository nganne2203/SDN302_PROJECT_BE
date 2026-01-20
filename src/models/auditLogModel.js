import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true },

    method: { type: String, index: true },
    endpoint: { type: String, index: true },

    request: {
      body: mongoose.Schema.Types.Mixed,
      params: mongoose.Schema.Types.Mixed,
      query: mongoose.Schema.Types.Mixed
    },

    response: {
      status: Number,
      body: mongoose.Schema.Types.Mixed
    },

    ip: String,
    userAgent: String,

    duration: Number,
    error: {
      message: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ endpoint: 1, createdAt: -1 })
auditLogSchema.index({ user: 1, createdAt: -1 })
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
)

auditLogSchema.plugin(mongoosePaginate)

export const auditLogModel = mongoose.model('auditLogs', auditLogSchema)
