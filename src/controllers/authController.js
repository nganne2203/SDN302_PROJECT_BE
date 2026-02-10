import { AUTH_SERVICE } from '#services/authService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const register = async (req, res, next) => {
  try {
    const result = await AUTH_SERVICE.registerUser(req.body, {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    })
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result.user,
      message: result.message
    }))
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await AUTH_SERVICE.loginUser(req.body, {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    })
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Đăng nhập thành công'
    }))
  } catch (error) { next(error) }
}

// eslint-disable-next-line no-unused-vars
const googleCallback = async (req, res, next) => {
  try {
    const result = await AUTH_SERVICE.googleAuth(req.user, {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    })

    const redirectUrl = AUTH_SERVICE.buildGoogleAuthRedirectUrl(result, res)
    res.redirect(redirectUrl)
  } catch (error) {
    const errorUrl = AUTH_SERVICE.buildGoogleAuthErrorUrl(error)
    res.redirect(errorUrl)
  }
}

const verifyOtp = async (req, res, next) => {
  try {
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    }

    const result = await AUTH_SERVICE.verifyOtp(req.body, requestInfo)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: result?.data || null,
      message: result?.message || 'Xác thực OTP thành công'
    }))
  } catch (error) { next(error) }
}

const resendVerificationCode = async (req, res, next) => {
  try {
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    }
    const result = await AUTH_SERVICE.resendVerificationCode(req.body, requestInfo)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: result.message || 'Gửi lại mã xác thực thành công'
    }))
  } catch (error) { next(error) }
}

const refreshToken = async (req, res, next) => {
  try {
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    }
    const result = await AUTH_SERVICE.refreshToken(req.body, requestInfo)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      message: 'Làm mới token thành công'
    }))
  } catch (error) { next(error) }
}

const logout = async (req, res, next) => {
  try {
    const result = await AUTH_SERVICE.logout(req.body)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: result.message || 'Đăng xuất thành công'
    }))
  } catch (error) { next(error) }
}

const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await AUTH_SERVICE.logoutAll(userId)

    res.status(StatusCodes.OK).json(responseSuccess({
      data: null,
      message: result.message || 'Đăng xuất khỏi tất cả thiết bị thành công'
    }))
  } catch (error) { next(error) }
}

const googleError = async (req, res) => {
  res.status(StatusCodes.UNAUTHORIZED).json({
    success: false,
    message: 'Xác thực Google thất bại',
    error: 'GOOGLE_AUTH_FAILED'
  })
}

export const AUTH_CONTROLLER = {
  register,
  login,
  googleCallback,
  googleError,
  verifyOtp,
  resendVerificationCode,
  refreshToken,
  logout,
  logoutAll
}
