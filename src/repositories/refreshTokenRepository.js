import { refreshTokenModel } from '#models/refreshTokenModel.js'

const createRefreshToken = async (data) => {
  try {
    return await refreshTokenModel.create(data)
  } catch (error) {
    if (error.code === 11000) {
      return await refreshTokenModel.findOne({ token: data.token })
    }
    throw error
  }
}

const findRefreshToken = async (token) => {
  return await refreshTokenModel.findOne({ token, isRevoked: false })
}

const findRefreshTokensByUserId = async (userId) => {
  return await refreshTokenModel.find({ user: userId, isRevoked: false })
}

const revokeRefreshToken = async (token) => {
  return await refreshTokenModel.findOneAndUpdate(
    { token },
    { isRevoked: true },
    { new: true }
  )
}

const revokeAllRefreshTokensByUserId = async (userId) => {
  return await refreshTokenModel.updateMany(
    { user: userId, isRevoked: false },
    { isRevoked: true }
  )
}

const deleteExpiredRefreshTokens = async () => {
  return await refreshTokenModel.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true }
    ]
  })
}

export const REFRESHTOKEN_REPOSITORY = {
  createRefreshToken,
  findRefreshToken,
  findRefreshTokensByUserId,
  revokeAllRefreshTokensByUserId,
  revokeRefreshToken,
  deleteExpiredRefreshTokens
}