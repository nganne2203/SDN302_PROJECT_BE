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
      data: {
        user: result.user
      },
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

export const AUTH_CONTROLLER = {
  register,
  login,
  googleCallback
}
