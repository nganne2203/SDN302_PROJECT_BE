import { transporter } from '#configs/mail.js'
import { env } from '#configs/environment.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

const sendVerificationCode = async (to, code, type = VERIFY_TYPE.REGISTER, expiresInMinutes = 5) => {
  const subjects = {
    [VERIFY_TYPE.REGISTER]: 'Mã Xác Thực Đăng Ký',
    [VERIFY_TYPE.CHANGE_EMAIL]: 'Mã Xác Thực Thay Đổi Email',
    [VERIFY_TYPE.CHANGE_INFO]: 'Mã Xác Thực Thay Đổi Thông Tin',
    [VERIFY_TYPE.RESET_PASSWORD]: 'Mã Xác Thực Đặt Lại Mật Khẩu',
    [VERIFY_TYPE.VERIFY_EMAIL]: 'Mã Xác Thực Email'
  }

  const titles = {
    [VERIFY_TYPE.REGISTER]: 'Mã Xác Thực Đăng Ký',
    [VERIFY_TYPE.CHANGE_EMAIL]: 'Mã Xác Thực Thay Đổi Email',
    [VERIFY_TYPE.CHANGE_INFO]: 'Mã Xác Thực Thay Đổi Thông Tin',
    [VERIFY_TYPE.RESET_PASSWORD]: 'Đặt Lại Mật Khẩu',
    [VERIFY_TYPE.VERIFY_EMAIL]: 'Xác Thực Email'
  }

  const descriptions = {
    [VERIFY_TYPE.REGISTER]: 'Sử dụng mã này để hoàn tất đăng nhập của bạn:',
    [VERIFY_TYPE.CHANGE_EMAIL]: 'Sử dụng mã này để thay đổi email của bạn:',
    [VERIFY_TYPE.CHANGE_INFO]: 'Sử dụng mã này để thay đổi thông tin của bạn:',
    [VERIFY_TYPE.RESET_PASSWORD]: 'Sử dụng mã này để đặt lại mật khẩu của bạn:',
    [VERIFY_TYPE.VERIFY_EMAIL]: 'Sử dụng mã này để xác thực địa chỉ email của bạn:'
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titles[type] || 'Verification Code'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${titles[type] || 'Mã Xác Thực'}</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          <p>${descriptions[type] || 'Mã xác thực của bạn là:'}</p>
          
          <div class="code-box">
            <span class="code">${code}</span>
          </div>
          
          <div class="warning">
            <strong>Quan trọng:</strong>
            <ul>
              <li>Mã này sẽ hết hạn sau <strong>${expiresInMinutes} phút</strong></li>
              <li>Không bao giờ chia sẻ mã này với bất kỳ ai</li>
              <li>Nếu bạn không yêu cầu mã này, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi</li>
            </ul>
          </div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
        </div>
        <div class="footer">
          <p>Đây là email tự động. Vui lòng không trả lời email này.</p>
          <p>&copy; ${new Date().getFullYear()} ${env.AUTHOR || 'SWD392'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
${titles[type] || 'Mã Xác Thực'}

${descriptions[type] || 'Mã xác thực của bạn là:'}

${code}

Mã này sẽ hết hạn sau ${expiresInMinutes} phút.
Không bao giờ chia sẻ mã này với bất kỳ ai.
Nếu bạn không yêu cầu mã này, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
  `

  const mailOptions = {
    from: `"${env.AUTHOR || 'No Reply'}" <${env.EMAIL_USER}>`,
    to,
    subject: subjects[type] || 'Mã Xác Thực',
    text: textContent,
    html: htmlContent
  }

  return await transporter.sendMail(mailOptions)
}

const sendPasswordResetNotification = async (to, fullName, password = '') => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Đặt Lại Mật Khẩu Thành Công</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <div class="info">
            <p><strong>Mật khẩu của bạn đã được đặt lại thành công.</strong></p>
            <p>Mật khẩu mới của bạn là: <strong>${password}</strong></p>
          </div>
          <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay sau khi có thể để bảo mật tài khoản của bạn.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"${env.AUTHOR || 'E-Learning'}" <${env.EMAIL_USER}>`,
    to,
    subject: 'Đặt Lại Mật Khẩu Thành Công',
    html: htmlContent
  }
  return await transporter.sendMail(mailOptions)
}

const sendMail = async (email, subject, htmlContent) => {
  const mailOptions = {
    from: env.EMAIL_USER,
    to: email,
    subject: subject,
    html: htmlContent
  }
  return await transporter.sendMail(mailOptions)
}

const changePasswordNotification = async (to) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Đổi Mật Khẩu Thành Công</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          <div class="info">
            <p><strong>Mật khẩu tài khoản của bạn đã được thay đổi thành công.</strong></p>
          </div>
          <p>Nếu bạn không thực hiện thay đổi này, vui lòng đặt lại mật khẩu ngay lập tức và liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const subject = 'Thông Báo Đổi Mật Khẩu'

  return await sendMail(to, subject, htmlContent)
}

const wellcomeEmail = async (to, password) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Chào Mừng Bạn Đến Với Chúng Tôi!</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          <div class="info">
            <p><strong>Tài khoản của bạn đã được tạo thành công.</strong></p>
            <p>Mật khẩu của bạn là: <strong>${password}</strong></p>
          </div>
          <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay sau khi có thể để bảo mật tài khoản của bạn.</p>
        </div>
      </div>
    </body>
    </html>
  `
  const subject = 'Chào Mừng Bạn Đến Với Chúng Tôi!'
  return await sendMail(to, subject, htmlContent)
}

const sendOrderConfirmation = async (to, fullName, order) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const orderItemsHtml = order.items.map(item => {
    const servicesHtml = item.services && item.services.length > 0
      ? item.services.map(s => `<li style="font-size: 12px; color: #666;">+ ${s.service?.name || 'Service'}: ${formatCurrency(s.price)}</li>`).join('')
      : ''

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          ${item.product?.name || 'Product'}
          ${servicesHtml ? `<ul style="margin: 5px 0; padding-left: 20px;">${servicesHtml}</ul>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">
          ${formatCurrency(item.price * item.quantity + (item.services?.reduce((sum, s) => sum + s.price, 0) || 0) * item.quantity)}
        </td>
      </tr>
    `
  }).join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-info { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff; }
        th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
        .total-row { background: #e8f5e9; font-weight: bold; font-size: 16px; }
        .success-badge { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Đơn Hàng Đã Được Xác Nhận</h1>
          <p style="font-size: 18px; margin: 10px 0;">Mã đơn hàng: <strong>${order.orderNumber}</strong></p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi!</p>
          
          <div class="order-info">
            <h3 style="margin-top: 0; color: #28a745;">Thông Tin Đơn Hàng</h3>
            <div class="info-row">
              <span class="label">Mã đơn hàng:</span>
              <span>${order.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="label">Ngày đặt:</span>
              <span>${new Date(order.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <div class="info-row">
              <span class="label">Trạng thái:</span>
              <span class="success-badge">${order.orderStatus === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}</span>
            </div>
            <div class="info-row">
              <span class="label">Phương thức thanh toán:</span>
              <span>${order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}</span>
            </div>
          </div>

          <div class="order-info">
            <h3 style="margin-top: 0; color: #28a745;">Địa Chỉ Giao Hàng</h3>
            <p><strong>${order.shippingAddress.fullname}</strong></p>
            <p>Điện thoại: ${order.shippingAddress.phone}</p>
            <p>${order.shippingAddress.addressLine}, ${order.shippingAddress.ward}, ${order.shippingAddress.city}</p>
          </div>

          <h3 style="color: #28a745;">Chi Tiết Đơn Hàng</h3>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th style="text-align: center; width: 80px;">SL</th>
                <th style="text-align: right; width: 120px;">Đơn giá</th>
                <th style="text-align: right; width: 120px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsHtml}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tạm tính:</td>
                <td style="padding: 10px; text-align: right;">${formatCurrency(order.subtotal)}</td>
              </tr>
              ${order.pricingApplied && order.pricingApplied.length > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; color: #dc3545; font-weight: bold;">Giảm giá:</td>
                <td style="padding: 10px; text-align: right; color: #dc3545;">-${formatCurrency(order.pricingApplied.reduce((sum, p) => sum + (p.discountAmount || 0), 0))}</td>
              </tr>
              ` : ''}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Phí giao hàng:</td>
                <td style="padding: 10px; text-align: right;">${order.shippingFee > 0 ? formatCurrency(order.shippingFee) : '<span style="color: #28a745;">Miễn phí</span>'}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="padding: 15px; text-align: right;">TỔNG CỘNG:</td>
                <td style="padding: 15px; text-align: right; color: #28a745; font-size: 18px;">${formatCurrency(order.totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          ${order.message ? `
          <div class="order-info">
            <h4 style="margin-top: 0;">Ghi chú:</h4>
            <p style="font-style: italic;">${order.message}</p>
          </div>
          ` : ''}

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <strong>Lưu ý:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Đơn hàng của bạn đang được xử lý</li>
              <li>Bạn sẽ nhận được thông báo khi đơn hàng được giao</li>
              <li>Thanh toán khi nhận hàng (COD)</li>
            </ul>
          </div>

          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
          <p style="margin-top: 30px;">Trân trọng,<br><strong>${env.AUTHOR || 'Phone Accessories Team'}</strong></p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"${env.AUTHOR || 'Phone Accessories'}" <${env.EMAIL_USER}>`,
    to,
    subject: `Xác Nhận Đơn Hàng #${order.orderNumber}`,
    html: htmlContent
  }

  return await transporter.sendMail(mailOptions)
}

const sendOrderStatusUpdate = async (to, fullName, order) => {
  const statusMessages = {
    pending: 'Đang chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang vận chuyển',
    delivered: 'Đã giao hàng',
    canceled: 'Đã hủy'
  }

  const statusColors = {
    pending: '#ffc107',
    confirmed: '#28a745',
    shipped: '#17a2b8',
    delivered: '#28a745',
    canceled: '#dc3545'
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColors[order.orderStatus]}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-info { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .status-badge { background: ${statusColors[order.orderStatus]}; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cập Nhật Trạng Thái Đơn Hàng</h1>
          <p style="font-size: 18px;">Mã: ${order.orderNumber}</p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Đơn hàng của bạn đã được cập nhật trạng thái mới:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge">${statusMessages[order.orderStatus]}</span>
          </div>

          ${order.delivery?.trackingCode ? `
          <div class="order-info">
            <h4>Thông tin vận chuyển:</h4>
            <p><strong>Đơn vị:</strong> ${order.delivery.providerName}</p>
            <p><strong>Mã vận đơn:</strong> ${order.delivery.trackingCode}</p>
            ${order.delivery.estimatedDeliveryDate ? `<p><strong>Dự kiến giao:</strong> ${new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString('vi-VN')}</p>` : ''}
          </div>
          ` : ''}

          <p>Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi!</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"${env.AUTHOR || 'Phone Accessories'}" <${env.EMAIL_USER}>`,
    to,
    subject: `Đơn Hàng #${order.orderNumber} - ${statusMessages[order.orderStatus]}`,
    html: htmlContent
  }

  return await transporter.sendMail(mailOptions)
}

const sendOrderCancellation = async (to, fullName, order) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-info { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Đơn Hàng Đã Bị Hủy</h1>
          <p style="font-size: 18px;">Mã: ${order.orderNumber}</p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Đơn hàng của bạn đã được hủy thành công.</p>
          
          <div class="order-info">
            <h4>Thông tin đơn hàng:</h4>
            <p><strong>Mã đơn hàng:</strong> ${order.orderNumber}</p>
            <p><strong>Tổng tiền:</strong> ${formatCurrency(order.totalAmount)}</p>
            ${order.cancelReason ? `<p><strong>Lý do hủy:</strong> ${order.cancelReason}</p>` : ''}
          </div>

          <p>Nếu bạn muốn đặt lại đơn hàng hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          <p>Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi!</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"${env.AUTHOR || 'Phone Accessories'}" <${env.EMAIL_USER}>`,
    to,
    subject: `Đơn Hàng #${order.orderNumber} - Đã Hủy`,
    html: htmlContent
  }

  return await transporter.sendMail(mailOptions)
}

export const EMAIL_SERVICE = {
  sendVerificationCode,
  sendPasswordResetNotification,
  changePasswordNotification,
  wellcomeEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation
}