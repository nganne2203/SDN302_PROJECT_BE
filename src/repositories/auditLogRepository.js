import { auditLogModel } from '#models/auditLogModel.js'

const createAuditLog = async (logData) => {
  return await auditLogModel.create(logData)
}

const getAuditLogs = async (filter = {}, options = {}) => {
  return await auditLogModel.paginate(filter, options)
}

export const AUDITLOG_REPOSITORY = {
  createLog: createAuditLog,
  getLogs: getAuditLogs
}