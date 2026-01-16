import { JWT_UTILS } from '#utils/jwtUtil.js'
import { REFRESHTOKEN_REPOSITORY } from '#repositories/refreshTokenRepository.js'
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

export const TOKEN_SERVICE = {
  createToken
}