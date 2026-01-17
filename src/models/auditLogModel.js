import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const auditLogSchema = new mongoose.Schema(
  {
	  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    action: { type: String, required: true },
    target: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    message: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
)
auditLogSchema.plugin(mongoosePaginate)

export const auditLogModel = mongoose.model('auditLogs', auditLogSchema)