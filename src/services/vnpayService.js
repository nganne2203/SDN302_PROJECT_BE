import crypto from 'crypto'
import querystring from 'qs'
import { env } from '#configs/environment.js'

const VNPAY_CONFIG = {
  vnp_TmnCode: env.VNPAY_TMN_CODE || 'DEMO',
  vnp_HashSecret: env.VNPAY_HASH_SECRET || 'DEMOSECRET',
  vnp_Url: env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: env.VNPAY_RETURN_URL || 'http://localhost:8080/api/v1/payments/vnpay-return',
  vnp_ApiUrl: env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/v1/transaction'
}

const sortObject = (obj) => {
  const sorted = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+')
  }
  return sorted
}

const createPaymentUrl = (params) => {
  const { orderNumber, amount, orderInfo, ipAddress, locale = 'vn', bankCode = '' } = params

  const date = new Date()
  const createDate = formatDate(date)
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)) // 15 minutes expiry

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderNumber,
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderNumber}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // VNPay requires amount in smallest currency unit
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_IpAddr: ipAddress,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  }

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode
  }

  const sortedParams = sortObject(vnp_Params)
  const signData = querystring.stringify(sortedParams, { encode: false })
  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  sortedParams.vnp_SecureHash = signed

  const paymentUrl = `${VNPAY_CONFIG.vnp_Url}?${querystring.stringify(sortedParams, { encode: false })}`

  return paymentUrl
}

const verifyReturnUrl = (vnpParams) => {
  const secureHash = vnpParams.vnp_SecureHash

  const params = { ...vnpParams }
  delete params.vnp_SecureHash
  delete params.vnp_SecureHashType

  const sortedParams = sortObject(params)
  const signData = querystring.stringify(sortedParams, { encode: false })
  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  const isValid = secureHash === signed

  return {
    isValid,
    vnp_TxnRef: vnpParams.vnp_TxnRef,
    vnp_ResponseCode: vnpParams.vnp_ResponseCode,
    vnp_TransactionNo: vnpParams.vnp_TransactionNo,
    vnp_BankCode: vnpParams.vnp_BankCode,
    vnp_Amount: parseInt(vnpParams.vnp_Amount) / 100, // Convert back to VND
    vnp_OrderInfo: vnpParams.vnp_OrderInfo,
    vnp_PayDate: vnpParams.vnp_PayDate,
    vnp_TransactionStatus: vnpParams.vnp_TransactionStatus
  }
}

const isPaymentSuccess = (responseCode) => {
  return responseCode === '00'
}

const getResponseMessage = (responseCode) => {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
  }

  return messages[responseCode] || messages['99']
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

const queryTransaction = async (params) => {
  const { orderId, transDate, ipAddress } = params

  const date = new Date()
  const requestId = `${date.getTime()}`

  const vnp_Params = {
    vnp_RequestId: requestId,
    vnp_Version: '2.1.0',
    vnp_Command: 'querydr',
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Kiem tra ket qua GD OrderId:${orderId}`,
    vnp_TransactionDate: transDate,
    vnp_CreateDate: formatDate(date),
    vnp_IpAddr: ipAddress
  }

  const signData = `${vnp_Params.vnp_RequestId}|${vnp_Params.vnp_Version}|${vnp_Params.vnp_Command}|${vnp_Params.vnp_TmnCode}|${vnp_Params.vnp_TxnRef}|${vnp_Params.vnp_TransactionDate}|${vnp_Params.vnp_CreateDate}|${vnp_Params.vnp_IpAddr}|${vnp_Params.vnp_OrderInfo}`

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret)
  vnp_Params.vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  try {
    const response = await fetch(VNPAY_CONFIG.vnp_ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vnp_Params)
    })

    return await response.json()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('VNPay query transaction error:', error)
    throw error
  }
}

const getSupportedBanks = () => {
  return [
    { code: 'NCB', name: 'Ngân hàng NCB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/ncb.png' },
    { code: 'AGRIBANK', name: 'Ngân hàng Agribank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/agribank.png' },
    { code: 'SCB', name: 'Ngân hàng SCB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/scb.png' },
    { code: 'SACOMBANK', name: 'Ngân hàng SacomBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/sacombank.png' },
    { code: 'EXIMBANK', name: 'Ngân hàng EximBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/eximbank.png' },
    { code: 'MSBANK', name: 'Ngân hàng MSBANK', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/msbank.png' },
    { code: 'NAMABANK', name: 'Ngân hàng NamABank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/namabank.png' },
    { code: 'VNMART', name: 'Ví điện tử VnMart', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/vnmart.png' },
    { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/vietinbank.png' },
    { code: 'VIETCOMBANK', name: 'Ngân hàng VCB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/vietcombank.png' },
    { code: 'HDBANK', name: 'Ngân hàng HDBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/hdbank.png' },
    { code: 'DONGABANK', name: 'Ngân hàng Đông Á', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/dongabank.png' },
    { code: 'TPBANK', name: 'Ngân hàng TPBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/tpbank.png' },
    { code: 'OJB', name: 'Ngân hàng OceanBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/ojb.png' },
    { code: 'BIDV', name: 'Ngân hàng BIDV', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/bidv.png' },
    { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/techcombank.png' },
    { code: 'VPBANK', name: 'Ngân hàng VPBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/vpbank.png' },
    { code: 'MBBANK', name: 'Ngân hàng MBBank', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/mbbank.png' },
    { code: 'ACB', name: 'Ngân hàng ACB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/acb.png' },
    { code: 'OCB', name: 'Ngân hàng OCB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/ocb.png' },
    { code: 'IVB', name: 'Ngân hàng IVB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/ivb.png' },
    { code: 'SHB', name: 'Ngân hàng SHB', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/shb.png' },
    { code: 'VNPAYQR', name: 'VNPay QR', logo: 'https://sandbox.vnpayment.vn/paymentv2/images/bank/vnpayqr.png' }
  ]
}

export const VNPAY_SERVICE = {
  createPaymentUrl,
  verifyReturnUrl,
  isPaymentSuccess,
  getResponseMessage,
  queryTransaction,
  getSupportedBanks,
  formatDate
}
