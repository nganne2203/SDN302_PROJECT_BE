import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer

export default async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  // Set env for tests
  process.env.MONGODB_URI = mongoUri
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-key'
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d'
  process.env.EMAIL_USER = 'test@example.com'
  process.env.EMAIL_PASSWORD = 'test-password'

  global.__MONGOSERVER__ = mongoServer
}
