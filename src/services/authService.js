import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import ApiError from '#utils/ApiError.js'
import { RoleEnum, USER_PROVIDER } from '#constants/userConstant.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'
import { VERIFICATION_REPOSITORY } from '#repositories/verificationRepository.js'
import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import { BCRYPT_UTILS } from '#utils/bcryptUtil.js'
import { env } from '#configs/environment.js'
import { JWT_UTILS } from '#utils/jwtUtil.js'
import { REFRESHTOKEN_REPOSITORY } from '#repositories/refreshTokenRepository.js'
import { maskEmail } from '#utils/formatterUtil.js'

const buildTokenPayload = (user) => {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  }
}

const createToken = async (user, ipAddress = '', userAgent = '') => {
  const payload = buildTokenPayload(user)
  const {
    accessToken,
    refreshToken
  } = JWT_UTILS.generateTokens(payload)

  const refreshTokenExpires = JWT_UTILS.parseRefreshToken()
  const expiresAt = new Date(Date.now() + refreshTokenExpires)

  await REFRESHTOKEN_REPOSITORY.createRefreshToken({
    user: user._id,
    token: refreshToken,
    ipAddress,
    userAgent,
    expiresAt
  })

  return {
    accessToken,
    refreshToken
  }
}

const registerUser = async (userData, requestInfo = {}) => {
  const { ipAddress = '', userAgent = '' } = requestInfo

  if (!userData.email) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Email là bắt buộc'])
  const existingUser = await USER_REPOSITORY.getUserByEmail(userData.email)
  if (existingUser) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Email đã được sử dụng'])
  }
  const newUser = await USER_REPOSITORY.createUser({
    ...userData,
    role: RoleEnum.CUSTOMER
  })

  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(newUser._id, VERIFY_TYPE.VERIFY_EMAIL)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    userId: newUser._id,
    type: VERIFY_TYPE.VERIFY_EMAIL,
    code,
    expiresAt: GENERATE_UTILS.expiresInMinutes(),
    ipAddress,
    userAgent
  })

  await EMAIL_SERVICE.sendVerificationCode(userData.email, code, VERIFY_TYPE.VERIFY_EMAIL, GENERATE_UTILS.OTP_EXPIRES_IN_MINUTES)

  return {
    user: newUser,
    message: 'Đăng ký thành công. Vui lòng kiểm tra email của bạn để lấy mã xác thực.'
  }
}

const loginUser = async (data, requestInfo = {}) => {
  const { email, password } = data
  const { ipAddress = '', userAgent = '' } = requestInfo

  const user = await USER_REPOSITORY.getUserByEmail(email, { includePassword: true })
  if (!user) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Email hoặc mật khẩu không chính xác'
    ])
  }

  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }

  if (!user.isEmailVerified) {
    throw new ApiError(ERROR_CODES.EMAIL_NOT_VERIFIED, [
      'Vui lòng xác nhận email trước khi đăng nhập'
    ])
  }

  const isPasswordValid = await BCRYPT_UTILS.comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Email hoặc mật khẩu không chính xác'
    ])
  }

  const tokens = await createToken(user, ipAddress, userAgent)

  return {
    ...tokens
  }
}

const googleAuth = async (googleUserData, requestInfo = {}) => {
  const { ipAddress = '', userAgent = '' } = requestInfo
  const { googleId, email, fullname, avatar } = googleUserData

  let user = await USER_REPOSITORY.getUserByGoogleId(googleId)

  if (!user) {
    user = await USER_REPOSITORY.getUserByEmail(email)
  }

  if (user) {
    if (!user.googleId) {
      user = await USER_REPOSITORY.updateUserById(user._id, {
        googleId,
        provider: USER_PROVIDER.GOOGLE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        avatar: avatar || user.avatar,
        password: GENERATE_UTILS.generatePasswordResetToken()
      })
      await EMAIL_SERVICE.wellcomeEmail(email, user.password)
    }

    if (!user.isActive) {
      throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
        'Tài khoản của bạn đã bị vô hiệu hóa'
      ])
    }

    const tokens = await createToken(user, ipAddress, userAgent)
    return {
      ...tokens,
      isNewUser: false
    }
  }

  const newUser = await USER_REPOSITORY.createUser({
    googleId,
    email,
    fullname,
    avatar,
    provider: USER_PROVIDER.GOOGLE,
    role: RoleEnum.CUSTOMER,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    password: null
  })

  const tokens = await createToken(newUser, ipAddress, userAgent)

  return {
    ...tokens,
    isNewUser: true
  }
}

const buildGoogleAuthRedirectUrl = (result, res) => {
  const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'
  const redirectUrl = new URL(`${clientUrl}/auth/callback`)

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  redirectUrl.searchParams.set('accessToken', result.accessToken)
  redirectUrl.searchParams.set('isNewUser', String(result.isNewUser))

  return redirectUrl.toString()
}

const buildGoogleAuthErrorUrl = (error) => {
  const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'
  const errorUrl = new URL(`${clientUrl}/auth/error`)
  errorUrl.searchParams.set('error', error.message)
  return errorUrl.toString()
}

// eslint-disable-next-line no-unused-vars
const handleOtpVerified = async (type, user, requestInfo) => {
  // const { ipAddress, userAgent } = requestInfo

  switch (type) {
  // case VERIFY_TYPE.LOGIN: {
  //   const tokens = await createToken(user, ipAddress, userAgent)
  //   return {
  //     data: {
  //       accessToken: tokens.accessToken,
  //       refreshToken: tokens.refreshToken
  //     },
  //     message: 'Xác thực thành công'
  //   }
  // }

  case VERIFY_TYPE.VERIFY_EMAIL: {
    if (user.isEmailVerified) {
      throw new ApiError(ERROR_CODES.EMAIL_ALREADY_VERIFIED)
    }

    await USER_REPOSITORY.updateUserById(user._id, { isEmailVerified: true, emailVerifiedAt: new Date() })

    return {
      data: null,
      message: 'Xác nhận email thành công. Bạn có thể đăng nhập.'
    }
  }

  case VERIFY_TYPE.RESET_PASSWORD: {
    const newPassword = GENERATE_UTILS.generatePasswordResetToken()
    const hashedPassword = await BCRYPT_UTILS.hashPassword(newPassword)
    await USER_REPOSITORY.updateUserById(user._id, {
      password: hashedPassword
    })
    await EMAIL_SERVICE.sendPasswordResetNotification(user.email, user.fullName, newPassword)
    return {
      data: null,
      message: `Xác thực thành công. Mật khẩu của bạn đã được đặt lại và gửi đến email ${maskEmail(user.email)}`
    }
  }
  default:
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Loại xác thực không hợp lệ'])
  }
}

const verifyOtp = async (data, requestInfo = {}) => {
  const { email, code, type = VERIFY_TYPE.VERIFY_EMAIL } = data

  const user = await USER_REPOSITORY.getUserByEmail(email)

  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Email không tồn tại'])
  if (!user.isActive) throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, ['Tài khoản của bạn đã bị vô hiệu hóa'])
  const verifiCode = await VERIFICATION_REPOSITORY.findVerificationCode(user._id, type, code)

  if (!verifiCode) {
    const lastestCode = await VERIFICATION_REPOSITORY.findLatestVerificationCode(user._id, type)
    if (lastestCode) {
      await VERIFICATION_REPOSITORY.incrementVerificationAttempts(lastestCode._id)
      if (lastestCode.attempts + 1 >= lastestCode.maxAttempts) {
        await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(user._id, type)
        throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Bạn đã vượt quá số lần thử cho phép. Vui lòng yêu cầu mã mới.'])
      }
    }
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Mã xác thực không hợp lệ'])
  }

  await VERIFICATION_REPOSITORY.markVerificationCodeAsVerified(verifiCode._id)
  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(user._id, type)

  return await handleOtpVerified(type, user, requestInfo)
}

const resendVerificationCode = async (data, requestInfo = {}) => {
  const { email, type = VERIFY_TYPE.VERIFY_EMAIL } = data
  const { ipAddress = '', userAgent = '' } = requestInfo
  const user = await USER_REPOSITORY.getUserByEmail(email)
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Email không tồn tại'])
  if (!user.isActive) throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, ['Tài khoản của bạn đã bị vô hiệu hóa'])
  if (type === VERIFY_TYPE.VERIFY_EMAIL && user.isEmailVerified) {
    throw new ApiError(ERROR_CODES.EMAIL_ALREADY_VERIFIED, ['Email của bạn đã được xác minh'])
  }
  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(user._id, type)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    userId: user._id,
    type,
    code,
    expiresAt: GENERATE_UTILS.expiresInMinutes(),
    ipAddress,
    userAgent
  })

  await EMAIL_SERVICE.sendVerificationCode(user.email, code, type, GENERATE_UTILS.OTP_EXPIRES_IN_MINUTES)

  return {
    message: `Mã xác thực đã được gửi lại đến email ${maskEmail(email)}`
  }
}

const refreshToken = async (data, requestInfo = {}) => {
  const { refreshToken } = data
  const { ipAddress = '', userAgent = '' } = requestInfo
  const existingToken = await REFRESHTOKEN_REPOSITORY.findRefreshToken(refreshToken)
  if (!existingToken) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, ['Refresh token không hợp lệ'])
  }

  let decoded

  try {
    decoded = JWT_UTILS.verifyRefreshToken(refreshToken)
  } catch {
    await REFRESHTOKEN_REPOSITORY.revokeRefreshToken(refreshToken)
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, ['Refresh token không hợp lệ'])
  }

  const user = await USER_REPOSITORY.getUserById(decoded.id)
  if (!user) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, ['Người dùng không tồn tại'])
  }

  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }

  await REFRESHTOKEN_REPOSITORY.revokeRefreshToken(refreshToken)
  const tokens = await createToken(user, ipAddress, userAgent)

  return {
    ...tokens
  }
}

const logout = async (data) => {
  const { refreshToken } = data
  if (!refreshToken) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Refresh token là bắt buộc'])
  }

  await REFRESHTOKEN_REPOSITORY.revokeRefreshToken(refreshToken)
  return {
    message: 'Đăng xuất thành công'
  }
}

const logoutAll = async (userId) => {
  await REFRESHTOKEN_REPOSITORY.revokeAllRefreshTokensByUserId(userId)
  return {
    message: 'Đăng xuất khỏi tất cả thiết bị thành công'
  }
}

const getCurrentUser = async (userId) => {
  const user = await USER_REPOSITORY.getUserById(userId)
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }

  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }

  return {
    ...user,
    id: user._id.toString()
  }
}

const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data
  const user = await USER_REPOSITORY.getUserById(userId, { includePassword: true })
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Người dùng không tồn tại'])
  }
  if (!user.isActive) {
    throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
      'Tài khoản của bạn đã bị vô hiệu hóa'
    ])
  }
  if (currentPassword === newPassword) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Mật khẩu mới không được trùng với mật khẩu hiện tại'
    ])
  }

  const isPasswordValid = await BCRYPT_UTILS.comparePassword(currentPassword, user.password)
  if (!isPasswordValid) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, [
      'Mật khẩu hiện tại không chính xác'
    ])
  }

  const hashedPassword = await BCRYPT_UTILS.hashPassword(newPassword)
  await USER_REPOSITORY.updateUserById(user._id, {
    password: hashedPassword
  })

  await EMAIL_SERVICE.changePasswordNotification(user.email)

  return {
    message: 'Đổi mật khẩu thành công'
  }
}

const resetPassword = async (data, requestInfo = {}) => {
  const { email } = data
  const { ipAddress = '', userAgent = '' } = requestInfo
  const user = await USER_REPOSITORY.getUserByEmail(email)
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, ['Email không tồn tại'])
  if (!user.isActive) throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, ['Tài khoản của bạn đã bị vô hiệu hóa'])
  if (!user.isEmailVerified) throw new ApiError(ERROR_CODES.EMAIL_NOT_VERIFIED, ['Vui lòng xác nhận email trước khi đặt lại mật khẩu'])
  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(user._id, VERIFY_TYPE.RESET_PASSWORD)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    userId: user._id,
    type: VERIFY_TYPE.RESET_PASSWORD,
    code,
    expiresAt: GENERATE_UTILS.expiresInMinutes(),
    ipAddress,
    userAgent
  })
  await EMAIL_SERVICE.sendVerificationCode(user.email, code, VERIFY_TYPE.RESET_PASSWORD, GENERATE_UTILS.OTP_EXPIRES_IN_MINUTES)
  return {
    message: `Mã xác thực đặt lại mật khẩu đã được gửi đến email ${maskEmail(email)}`
  }
}

export const AUTH_SERVICE = {
  registerUser,
  loginUser,
  googleAuth,
  buildGoogleAuthRedirectUrl,
  buildGoogleAuthErrorUrl,
  verifyOtp,
  resendVerificationCode,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword,
  resetPassword
}