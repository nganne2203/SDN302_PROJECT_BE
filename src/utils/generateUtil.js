import crypto from 'crypto'
import { env } from '#configs/environment.js'
import { parseTokenTTL } from '#utils/parseTokenUtil.js'

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString()
}

const generatePasswordResetToken = () => {
  return crypto.randomBytes(9).toString('base64url')
}

const expiresInMinutes = () => {
  const now = new Date()
  const minutes = parseTokenTTL(env.OTP_EXPIRES_IN)
  now.setMinutes(now.getMinutes() + minutes)
  return now
}

const OTP_EXPIRES_IN_MINUTES = env.OTP_EXPIRES_IN.replace(/\D/g, '')

export const GENERATE_UTILS = {
  generatePasswordResetToken,
  generateVerificationCode,
  expiresInMinutes,
  OTP_EXPIRES_IN_MINUTES
}