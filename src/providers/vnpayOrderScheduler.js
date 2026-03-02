import { ORDER_REPOSITORY } from '#repositories/orderRepository.js'
import { PAYMENT_REPOSITORY } from '#repositories/paymentRepository.js'

/**
 * VNPay payment window: 30 minutes.
 * Any online order with paymentMethod='vnpay' that remains 'pending' beyond
 * this window is considered abandoned and will be auto-cancelled.
 * Inventory was never decreased for pending VNPay orders, so no restore needed.
 */
const VNPAY_PAYMENT_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

let cleanupInterval = null

const cancelExpiredVNPayOrders = async () => {
  try {
    const expiredOrders = await ORDER_REPOSITORY.findExpiredPendingVNPayOrders(VNPAY_PAYMENT_EXPIRY_MS)

    if (expiredOrders.length === 0) return

    const orderIds = expiredOrders.map(o => o._id)
    const cancelReason = 'Hết thời gian thanh toán VNPay (tự động hủy sau 30 phút)'

    // Bulk-cancel the order records
    await Promise.all(
      orderIds.map(id =>
        ORDER_REPOSITORY.cancelOrder(id, cancelReason, null)
          .catch(err =>
            // eslint-disable-next-line no-console
            console.error(`[VNPay Scheduler] Không thể hủy đơn hàng ${id}:`, err.message)
          )
      )
    )

    // Bulk-cancel the associated pending payment records
    await PAYMENT_REPOSITORY.cancelPendingPaymentsByOrderIds(orderIds, cancelReason)

    // eslint-disable-next-line no-console
    console.log(`[VNPay Scheduler] Đã tự động hủy ${expiredOrders.length} đơn hàng VNPay hết hạn: ${expiredOrders.map(o => o.orderNumber).join(', ')}`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[VNPay Scheduler] Lỗi khi xử lý đơn hàng VNPay hết hạn:', error)
  }
}

/**
 * Start the VNPay expiry cleanup scheduler.
 * @param {number} intervalMs - How often to run the cleanup (default: 10 minutes)
 */
const startScheduler = (intervalMs = 10 * 60 * 1000) => {
  if (cleanupInterval) return

  // Run once immediately on startup to clean up any leftover records
  cancelExpiredVNPayOrders()
  cleanupInterval = setInterval(cancelExpiredVNPayOrders, intervalMs)
  // eslint-disable-next-line no-console
  console.log('[VNPay Scheduler] Bộ lập lịch tự động hủy đơn hàng VNPay hết hạn đã được khởi động.')
}

const stopScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    // eslint-disable-next-line no-console
    console.log('[VNPay Scheduler] Bộ lập lịch tự động hủy đơn hàng VNPay hết hạn đã được dừng.')
  }
}

const isSchedulerRunning = () => cleanupInterval !== null

export const VNPAY_ORDER_SCHEDULER = {
  startScheduler,
  stopScheduler,
  isSchedulerRunning
}
