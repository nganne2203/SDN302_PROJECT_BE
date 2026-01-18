import { ERROR_CODES } from '#constants/errorCode.js'
import ApiError from '#utils/ApiError.js'
import { env } from '#configs/environment.js'

export const verifyRecaptchaMiddleware = async (req, res, next) => {
  try {
    const { captchaToken } = req.body
    if (!captchaToken) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Captcha token là bắt buộc'])
    const secretKey = env.RECAPTCHA_SECRET_KEY
    if (!secretKey) throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Recaptcha secret key không được cấu hình'])
    const response = await fetch(env.VERIFY_CAPTCHA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: captchaToken
      })
    })
    const data = await response.json()
    if (!data.success) {
      throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Xác thực Captcha thất bại'])
    }
    next()
  } catch (error) {
    next(error)
  }
}