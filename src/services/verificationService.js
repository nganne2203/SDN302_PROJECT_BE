import { VERIFICATION_REPOSITORY } from '#repositories/verificationRepository.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

const createVerificationCode = async ({
  user = null,
  code = '',
  type = VERIFY_TYPE.REGISTER,
  expiresAt = null,
  ipAddress = '',
  userAgent = ''
}) => {
  return VERIFICATION_REPOSITORY.createVerificationCode({
    user,
    code,
    type,
    expiresAt,
    ipAddress,
    userAgent
  })
}

export const VERIFICATION_SERVICE = {
  createVerificationCode
}