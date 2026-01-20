import { AUDITLOG_REPOSITORY } from '#repositories/auditLogRepository.js'
import sanitize from '#utils/sanitizeUtil.js'

const auditLogMiddleware = async (req, res, next) => {
  const startTime = Date.now()
  const userId = req.user?._id || null

  const sanitizedBody = sanitize(req.body)

  await AUDITLOG_REPOSITORY.createLog({
    user: userId,
    type: 'request',
    method: req.method,
    endpoint: req.originalUrl,
    request: {
      body: sanitizedBody,
      params: req.params,
      query: req.query
    },
    ip: req.ip,
    userAgent: req.headers['user-agent']
  })

  const originalSend = res.send.bind(res)

  res.send = async (body) => {
    await AUDITLOG_REPOSITORY.createLog({
      user: userId,
      type: 'response',
      method: req.method,
      endpoint: req.originalUrl,
      response: {
        status: res.statusCode,
        body: typeof body === 'string' ? body.slice(0, 1000) : sanitize(body)
      },
      duration: Date.now() - startTime,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })
    originalSend(body)
  }

  next()
}

export default auditLogMiddleware