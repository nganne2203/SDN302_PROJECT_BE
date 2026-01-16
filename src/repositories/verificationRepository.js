import { verificationModel } from '#models/verificationModel.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

const createVerificationCode = async (data) => {
  return verificationModel.create(data)
}

const findVerificationCode = async (userId, code, type = VERIFY_TYPE.REGISTER) => {
  return await verificationModel.findOne({
    user: userId,
    code,
    type,
    verified: false,
    expiresAt: { $gt: new Date() }
  })
}

const findLatestVerificationCode = async (userId, type = VERIFY_TYPE.REGISTER) => {
  return await verificationModel.findOne({
    user: userId,
    type,
    verified: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 })
}

const incrementVerificationAttempts = async (codeId) => {
  return await verificationModel.findByIdAndUpdate(
    codeId,
    { $inc: { attempts: 1 } },
    { new: true }
  )
}

const markVerificationCodeAsVerified = async (codeId) => {
  return await verificationModel.findByIdAndUpdate(
    codeId,
    { verified: true },
    { new: true }
  )
}

const deleteVerificationCodesByUserId = async (userId, type = null) => {
  const filter = { user: userId }
  if (type) filter.type = type
  return await verificationModel.deleteMany(filter)
}

const deleteExpiredVerificationCodes = async () => {
  return await verificationModel.deleteMany({
    expiresAt: { $lt: new Date() }
  })
}

export const VERIFICATION_REPOSITORY = {
  createVerificationCode,
  findVerificationCode,
  findLatestVerificationCode,
  incrementVerificationAttempts,
  markVerificationCodeAsVerified,
  deleteExpiredVerificationCodes,
  deleteVerificationCodesByUserId
}