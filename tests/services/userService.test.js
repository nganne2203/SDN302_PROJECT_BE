import mongoose from 'mongoose'
import { USER_SERVICE } from '#services/userService.js'
import {
  createAdminUser,
  createTestUser
} from '../helpers/testHelpers.js'

describe('User Service Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI)
  })

  describe('updateUser', () => {
    it('keeps email verification when admin updates user without changing email', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser({
        email: 'verified@example.com',
        isEmailVerified: true,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z')
      })

      const updatedUser = await USER_SERVICE.updateUser(
        user._id,
        {
          fullname: 'Updated User',
          email: 'verified@example.com'
        },
        admin._id
      )

      expect(updatedUser.fullname).toBe('Updated User')
      expect(updatedUser.email).toBe('verified@example.com')
      expect(updatedUser.isEmailVerified).toBe(true)
      expect(updatedUser.emailVerifiedAt).toBeTruthy()
    })

    it('resets email verification when email actually changes', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser({
        email: 'old@example.com',
        isEmailVerified: true,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z')
      })

      const updatedUser = await USER_SERVICE.updateUser(
        user._id,
        {
          email: 'new@example.com'
        },
        admin._id
      )

      expect(updatedUser.email).toBe('new@example.com')
      expect(updatedUser.isEmailVerified).toBe(false)
      expect(updatedUser.emailVerifiedAt).toBeNull()
    })
  })
})
