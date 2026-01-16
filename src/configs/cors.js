import { env } from '#configs/environment.js'

export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = env.CLIENT_URLS
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}