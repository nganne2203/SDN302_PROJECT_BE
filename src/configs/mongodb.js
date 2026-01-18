import mongoose from 'mongoose'
import { env } from '#configs/environment.js'

let isConnected = false

export const CONNECT_DB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return

  await mongoose.connect(env.MONGODB_URI)
  isConnected = true
}

export const CLOSE_DB = async () => {
  await mongoose.connection.close()
  isConnected = false
}