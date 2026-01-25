import express from 'express'
import passport from '#configs/passport.js'
import { AUTH_CONTROLLER } from '#controllers/authController.js'
import { authRateLimiter } from '#middlewares/rateLimitHandlingmiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { AUTH_VALIDATION } from '#validations/authValidation.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import {
  REGISTER_FIELDS,
  LOGIN_FIELDS,
  REQUIRE_FIELD_REGISTER,
  VERIFY_OTP_FIELDS,
  RESEND_OTP_FIELDS,
  REFRESH_TOKEN_FIELDS,
  CHANGE_PASSWORD_FIELDS,
  RESET_PASSWORD_FIELDS,
  CONFIRM_RESET_PASSWORD_FIELDS
} from '#constants/userConstant.js'
import { verifyRecaptchaMiddleware } from '#middlewares/verifyCaptchaMiddleware.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new account.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - password
 *               - phone
 *               - addresses
 *               - avatar
 *               - captchaToken
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Mai Thi Thanh Ngan
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ngan@gmail.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               phone:
 *                 type: string
 *                 example: '0123456789'
 *               addresses:
 *                 type: [{
 *                  fullname: string,
 *                  phone: string,
 *                  addressLine: string,
 *                  city: string,
 *                  district: string,
 *                  ward: string,
 *                  isDefault: boolean
 *                 }]
 *                 example: [{
  *                 fullname: 'Mai Thi Thanh Ngan',
  *                 phone: '0123456789',
  *                 addressLine: '123 Le Loi',
  *                 city: 'Ho Chi Minh',
  *                 district: 'District 1',
  *                 ward: 'Ben Nghe',
  *                 isDefault: true
 *                 }]
 *               avatar:
 *                 type: string
 *                 format: url
 *                 example: 'http://example.com/avatar.jpg'
 *               captchaToken:
 *                 type: string
 *                 example: '03AGdBq24...'
 *     responses:
 *       201:
 *         description: Register successfully
 *       409:
 *         description: Email already exists
 */
router.post('/register',
  authRateLimiter,
  verifyRecaptchaMiddleware,
  sanitizeRequest(REGISTER_FIELDS, REQUIRE_FIELD_REGISTER),
  validationHandlingMiddleware(AUTH_VALIDATION.registerUser),
  AUTH_CONTROLLER.register
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - captchaToken
 *             properties:
 *               email:
 *                 type: string
 *                 example: ngan@gmail.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               captchaToken:
 *                 type: string
 *                 example: '03AGdBq24...'
 *     responses:
 *       200:
 *         description: Login success
 */
router.post('/login',
  authRateLimiter,
  // verifyRecaptchaMiddleware,
  sanitizeRequest(LOGIN_FIELDS, LOGIN_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.loginUser),
  AUTH_CONTROLLER.login
)

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     description: Redirects to Google OAuth consent screen
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles the callback from Google OAuth
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 */
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/google/error'
  }),
  AUTH_CONTROLLER.googleCallback
)

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Handles OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - type
 *             properties:
 *               email:
 *                type: string
 *                example: string
 *               code:
 *                 type: string
 *                 example: '123456'
 *               type:
 *                 type: string
 *                 enum: [verify_email, reset_password, change_password, change_email, change_info]
 *                 example: verify_email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp',
  authRateLimiter,
  sanitizeRequest(VERIFY_OTP_FIELDS, VERIFY_OTP_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.verifyOtp),
  AUTH_CONTROLLER.verifyOtp
)

/**
 * @swagger
 * /api/auth/resend-verification-code:
 *   post:
 *     summary: Resend OTP
 *     description: Handles resending OTP codes
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                type: string
 *                example: string
 *               type:
 *                 type: string
 *                 enum: [verify_email, reset_password, change_password, change_email, change_info]
 *                 example: verify_email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
router.post('/resend-verification-code',
  authRateLimiter,
  sanitizeRequest(RESEND_OTP_FIELDS, RESEND_OTP_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.resendVerificationCode),
  AUTH_CONTROLLER.resendVerificationCode
)

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh token
 *     description: Handles refreshing of access tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                type: string
 *                example: string
 *     responses:
 *       200:
 *         description: Refresh token successful
 */
router.post('/refresh-token',
  authRateLimiter,
  sanitizeRequest(REFRESH_TOKEN_FIELDS, REFRESH_TOKEN_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.refreshToken),
  AUTH_CONTROLLER.refreshToken
)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout
 *     description: Handles logout by invalidating the refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                type: string
 *                example: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout',
  authRateLimiter,
  sanitizeRequest(REFRESH_TOKEN_FIELDS, REFRESH_TOKEN_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.logout),
  AUTH_CONTROLLER.logout
)

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Handles logging out from all devices by invalidating all refresh tokens
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout from all devices successful
 */
router.post('/logout-all',
  authorizationMiddleware,
  AUTH_CONTROLLER.logoutAll
)

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Handles changing of user password
 *     tags: [Auth]
 *     security:
 *      - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                type: string
 *                example: string
 *               newPassword:
 *                type: string
 *                example: string
 *     responses:
 *       200:
 *         description: Change password successful
 */
router.post('/change-password',
  authRateLimiter,
  authorizationMiddleware,
  sanitizeRequest(CHANGE_PASSWORD_FIELDS, CHANGE_PASSWORD_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.changePassword),
  AUTH_CONTROLLER.changePassword
)

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Handles resetting of user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                type: string
 *                example: string
 *     responses:
 *       200:
 *         description: Reset password successful
 */
router.post('/reset-password',
  authRateLimiter,
  sanitizeRequest(RESET_PASSWORD_FIELDS, RESET_PASSWORD_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.resetPassword),
  AUTH_CONTROLLER.resetPassword
)

/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: Set password for OAuth users
 *     description: Allows OAuth users without a password to set one
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Set password successful
 */

router.post('/set-password',
  authRateLimiter,
  authorizationMiddleware,
  validationHandlingMiddleware(AUTH_VALIDATION.setPassword),
  AUTH_CONTROLLER.setPassword
)

/**
 * @swagger
 * /api/auth/confirm-reset-password:
 *   post:
 *     summary: Confirm reset password
 *     description: Confirm and finalize the password reset process
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Confirm reset password successful
 */
router.post('/confirm-reset-password',
  authRateLimiter,
  sanitizeRequest(CONFIRM_RESET_PASSWORD_FIELDS, CONFIRM_RESET_PASSWORD_FIELDS),
  validationHandlingMiddleware(AUTH_VALIDATION.confirmResetPassword),
  AUTH_CONTROLLER.confirmResetPassword
)

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the profile of the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Get current user profile successful
 */
router.get('/profile',
  authRateLimiter,
  authorizationMiddleware,
  AUTH_CONTROLLER.getCurrentUser
)
export const AUTH_ROUTE = router