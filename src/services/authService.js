import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import ApiError from '#utils/ApiError.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { USER_PROVIDER } from '#constants/userConstant.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'
import { VERIFICATION_REPOSITORY } from '#repositories/verificationRepository.js'
import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import { BCRYPT_UTILS } from '#utils/bcryptUtil.js'
import { env } from '#configs/environment.js'
import { JWT_UTILS } from '#utils/jwtUtil.js'
import { REFRESHTOKEN_REPOSITORY } from '#repositories/refreshTokenRepository.js'
import { maskEmail } from '#utils/formatterUtil.js'
import { CART_SERVICE } from '#services/cartService.js'
const buildTokenPayload = (user) => {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    branch: user.branch ? user.branch.toString() : null
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
  const hashedPassword = await BCRYPT_UTILS.hashPassword(userData.password)
  const newUser = await USER_REPOSITORY.createUser({
    ...userData,
    password: hashedPassword,
    role: RoleEnum.CUSTOMER
  })

  await CART_SERVICE.getOrCreateCart(newUser._id)

  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(newUser._id, VERIFY_TYPE.VERIFY_EMAIL)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    user: newUser._id,
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

    if (user && !user.googleId) {
      user = await USER_REPOSITORY.updateUserById(user._id, {
        googleId,
        provider: USER_PROVIDER.GOOGLE,
        avatar: avatar || user.avatar
      })
    }
  }

  if (user) {
    if (!user.isActive) {
      throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
        'Tài khoản của bạn đã bị vô hiệu hóa'
      ])
    }

    const tokens = await createToken(user, ipAddress, userAgent)
    const hasPassword = !!user.password

    return {
      ...tokens,
      isNewUser: false,
      hasPassword
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
    password: null,
    hasPassword: false
  })

  await CART_SERVICE.getOrCreateCart(newUser._id)

  const tokens = await createToken(newUser, ipAddress, userAgent)

  return {
    ...tokens,
    isNewUser: true,
    hasPassword: false
  }
}

const buildGoogleAuthRedirectUrl = (result, res) => {
  const clientUrl = env.CLIENT_URLS[0] || 'http://localhost:5173'
  const redirectUrl = new URL(`${clientUrl}/auth/callback`)

  const isProd = env.NODE_ENV === 'prod'

  if (!isProd) {
    redirectUrl.searchParams.set('refreshToken', result.refreshToken)
  } else {
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
  }

  redirectUrl.searchParams.set('accessToken', result.accessToken)
  redirectUrl.searchParams.set('isNewUser', String(result.isNewUser))
  redirectUrl.searchParams.set('hasPassword', String(result.hasPassword))

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
    return {
      data: null,
      message: 'Xác thực thành công. Bạn có thể đặt mật khẩu mới.'
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
  const verifiCode = await VERIFICATION_REPOSITORY.findVerificationCode(user._id, code, type)

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
    user: user._id,
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
  if (existingToken.expiresAt < new Date()) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, ['Refresh token đã hết hạn'])
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
  if (
    existingToken.ipAddress !== ipAddress ||
    existingToken.userAgent !== userAgent
  ) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, [
      'Thiết bị không hợp lệ'
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
  logoutAll
}