import { auditLogModel } from '#models/auditLogModel.js'

const createAuditLog = async (data) => {
  return auditLogModel.create(data)
}

const updateAuditLog = async (id, data) => {
  return auditLogModel.findByIdAndUpdate(id, data)
}

export const AUDITLOG_REPOSITORY = {
  createLog: createAuditLog,
  updateLog: updateAuditLog
}
