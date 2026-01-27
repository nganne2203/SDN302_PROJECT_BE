import { REFRESHTOKEN_REPOSITORY } from '#repositories/refreshTokenRepository.js'

let cleanupInterval = null

const cleanupExpiredTokens = async () => {
  try {
    const result = await REFRESHTOKEN_REPOSITORY.deleteExpiredRefreshTokens()
    const deletedCount = result.deletedCount || 0
    if (deletedCount > 0)
      // eslint-disable-next-line no-console
      console.log(`Đã xóa ${deletedCount} refresh token hết hạn hoặc bị thu hồi.`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi khi xóa refresh token hết hạn:', error)
  }
}

const startScheduler = (intervalMs = 60 * 60 * 1000) => {
  if (cleanupInterval) return

  cleanupExpiredTokens()
  cleanupInterval = setInterval(cleanupExpiredTokens, intervalMs)
  // eslint-disable-next-line no-console
  console.log('Bộ lập lịch xóa refresh token hết hạn đã được khởi động.')
}

const stopScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    // eslint-disable-next-line no-console
    console.log('Bộ lập lịch xóa refresh token hết hạn đã được dừng.')
  }
}

const isSchedulerRunning = () => {
  return cleanupInterval !== null
}

export const REFRESHTOKEN_SCHEDULER = {
  startScheduler,
  stopScheduler,
  isSchedulerRunning
}