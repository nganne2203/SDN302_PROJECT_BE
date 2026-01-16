import { transporter } from '#configs/mail.js'
import { env } from '#configs/environment.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'

const sendVerificationCode = async (to, code, type = 'login', expiresInMinutes = 10) => {
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
          <p>&copy; ${new Date().getFullYear()} ${env.AUTHOR || 'E-learning'}. All rights reserved.</p>
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

export const EMAIL_SERVICE = {
  sendVerificationCode
}