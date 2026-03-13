export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  // Use "canceled" (one L) to match validation and existing repository usage.
  // Keep both keys for backward compatibility with existing code.
  CANCELED: 'canceled',
  CANCELLED: 'canceled',
  // Legacy value support (older data may have "cancelled")
  CANCELLED_LEGACY: 'cancelled'
}

export const PAYMENT_METHODS = {
  COD: 'cod',
  VNPAY: 'vnpay'
}

export const PAYMENT_PROVIDERS = {
  COD: 'cod',
  VNPAY: 'vnpay'
}
