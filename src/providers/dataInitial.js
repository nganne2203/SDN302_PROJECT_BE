import { RoleEnum } from '#constants/userConstant.js'
import { userModel } from '#models/userModel.js'
import { USER_SERVICE } from '#services/userService.js'
import { env } from '#configs/environment.js'

const DEFAULT_ADMIN = {
  fullname: 'Admin',
  email: 'admin@example.com',
  password: 'Admin@123',
  role: RoleEnum.ADMIN,
  phone: '0123456789',
  addresses: [],
  avatar: '',
  isEmailVerified: true
}

export const initializeDefaultValue = async () => {
  // eslint-disable-next-line no-console
  console.log('[DB Init] Starting database initialization...')

  const adminExists = await userModel.exists({ role: RoleEnum.ADMIN })
  if (adminExists) {
    // eslint-disable-next-line no-console
    console.log('[DB Init] Admin already exists. Skipping initialization.')
    return { initialized: false }
  }

  const admin = await USER_SERVICE.createUserInternal({
    ...DEFAULT_ADMIN,
    isEmailVerified: true
  })

  // eslint-disable-next-line no-console
  console.log('[DB Init] Admin user created:', admin.email)

  return {
    initialized: true,
    admin
  }
}

export const resetDatabase = async () => {
  if (env.NODE_ENV !== 'dev') {
    throw new Error('Database reset is only allowed in development environment.')
  }

  // eslint-disable-next-line no-console
  console.log('[DB Reset] Resetting database...')
  await userModel.deleteMany({})
  // eslint-disable-next-line no-console
  console.log('[DB Reset] Database reset completed.')

  return await initializeDefaultValue()
}