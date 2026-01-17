import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import ApiError from '#utils/ApiError.js'
import { RoleEnum, USER_PROVIDER } from '#constants/userConstant.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'
import { VERIFICATION_REPOSITORY } from '#repositories/verificationRepository.js'
import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { EMAIL_SERVICE } from '#services/emailService.js'
import { BCRYPT_UTILS } from '#utils/bcryptUtil.js'
import { TOKEN_SERVICE } from '#services/tokenService.js'
import { env } from '#configs/environment.js'

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

  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(newUser._id, VERIFY_TYPE.REGISTER)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    userId: newUser._id,
    type: VERIFY_TYPE.REGISTER,
    code,
    ipAddress,
    userAgent
  })

  await EMAIL_SERVICE.sendVerificationCode(userData.email, code, VERIFY_TYPE.REGISTER, GENERATE_UTILS.OTP_EXPIRES_IN_MINUTES)

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

  const tokens = await TOKEN_SERVICE.createToken(user, ipAddress, userAgent)

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
        avatar: avatar || user.avatar
      })
    }

    if (!user.isActive) {
      throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED, [
        'Tài khoản của bạn đã bị vô hiệu hóa'
      ])
    }

    const tokens = await TOKEN_SERVICE.createToken(user, ipAddress, userAgent)
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

  const tokens = await TOKEN_SERVICE.createToken(newUser, ipAddress, userAgent)

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

export const AUTH_SERVICE = {
  registerUser,
  loginUser,
  googleAuth,
  buildGoogleAuthRedirectUrl,
  buildGoogleAuthErrorUrl
}