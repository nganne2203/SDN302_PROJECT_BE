import express from 'express'
import passport from '#configs/passport.js'
import { AUTH_CONTROLLER } from '#controllers/authController.js'
import { authRateLimiter } from '#middlewares/rateLimitHandlingMiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { AUTH_VALIDATION } from '#validations/authValidation.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import {
  REGISTER_FIELDS,
  LOGIN_FIELDS,
  REQUIRE_FIELD_REGISTER,
  REQUIRE_FIELD_REGISTER_NO_CAPTCHA,
  VERIFY_OTP_FIELDS,
  RESEND_OTP_FIELDS,
  REFRESH_TOKEN_FIELDS,
  LOGIN_NO_CAPTCHA_FIELDS,
  REGISTER_NO_CAPTCHA_FIELDS,
  LOGIN_GOOGLE_MOBILE_FIELDS
} from '#constants/userConstant.js'
import { verifyRecaptchaMiddleware } from '#middlewares/verifyCaptchaMiddleware.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new account. Avatar should be a Cloudinary publicId obtained from the upload image API.
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
 *                  ward: string,
 *                  isDefault: boolean
 *                 }]
 *                 example: [{
  *                 fullname: 'Mai Thi Thanh Ngan',
  *                 phone: '0123456789',
  *                 addressLine: '123 Le Loi',
  *                 city: 'Ho Chi Minh',
  *                 ward: 'Ben Nghe',
  *                 isDefault: true
 *                 }]
 *               avatar:
 *                 type: string
 *                 description: Cloudinary public ID obtained from upload image API
 *                 example: 'uploads/a1b2c3d4e5f6g7h8'
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
  validationHandlingMiddleware({ body: AUTH_VALIDATION.registerUser }),
  AUTH_CONTROLLER.register
)

/**
 * @swagger
 * /api/v1/auth/register-no-captcha:
 *   post:
 *     summary: Register a new user
 *     description: Register a new account. Avatar should be a Cloudinary publicId obtained from the upload image API.
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
 *                  ward: string,
 *                  isDefault: boolean
 *                 }]
 *                 example: [{
  *                 fullname: 'Mai Thi Thanh Ngan',
  *                 phone: '0123456789',
  *                 addressLine: '123 Le Loi',
  *                 city: 'Ho Chi Minh',
  *                 ward: 'Ben Nghe',
  *                 isDefault: true
 *                 }]
 *               avatar:
 *                 type: string
 *                 description: Cloudinary public ID obtained from upload image API
 *                 example: 'uploads/a1b2c3d4e5f6g7h8'
 *     responses:
 *       201:
 *         description: Register successfully
 *       409:
 *         description: Email already exists
 */
router.post('/register-no-captcha',
  authRateLimiter,
  sanitizeRequest(REGISTER_NO_CAPTCHA_FIELDS, REQUIRE_FIELD_REGISTER_NO_CAPTCHA),
  validationHandlingMiddleware({ body: AUTH_VALIDATION.registerUserNoCaptcha }),
  AUTH_CONTROLLER.register
)

/**
 * @swagger
 * /api/v1/auth/login:
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
  verifyRecaptchaMiddleware,
  sanitizeRequest(LOGIN_FIELDS, LOGIN_FIELDS),
  validationHandlingMiddleware({ body: AUTH_VALIDATION.loginUser }),
  AUTH_CONTROLLER.login
)

/**
 * @swagger
 * /api/v1/auth/login/no-captcha:
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
 *             properties:
 *               email:
 *                 type: string
 *                 example: ngan@gmail.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login success
 */
router.post('/login/no-captcha',
  authRateLimiter,
  sanitizeRequest(LOGIN_NO_CAPTCHA_FIELDS, LOGIN_NO_CAPTCHA_FIELDS),
  validationHandlingMiddleware({ body: AUTH_VALIDATION.loginUserNoCaptcha }),
  AUTH_CONTROLLER.login
)
/**
 * @swagger
 * /api/v1/auth/google:
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
 * /api/v1/auth/google/callback:
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
    failureRedirect: '/api/v1/auth/google/error'
  }),
  AUTH_CONTROLLER.googleCallback
)

/**
 * @swagger
 * /api/v1/auth/google/error:
 *   get:
 *     summary: Google OAuth error handler
 *     description: Handles Google OAuth authentication failures
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with error
 */
router.get('/google/error', AUTH_CONTROLLER.googleError)

/**
 * @swagger
 * /api/v1/auth/google/mobile:
 *   post:
 *     summary: Login/Register with Google for mobile clients
 *     description: Accepts Google ID token from mobile app, verifies token and returns app access/refresh tokens.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from mobile SDK
 *     responses:
 *       200:
 *         description: Google mobile login success
 */
router.post('/google/mobile',
  authRateLimiter,
  sanitizeRequest(LOGIN_GOOGLE_MOBILE_FIELDS, LOGIN_GOOGLE_MOBILE_FIELDS),
  validationHandlingMiddleware({ body: AUTH_VALIDATION.loginGoogleMobile }),
  AUTH_CONTROLLER.loginGoogleMobile
)

/**
 * @swagger
 * /api/v1/auth/verify-otp:
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
  validationHandlingMiddleware({ body: AUTH_VALIDATION.verifyOtp }),
  AUTH_CONTROLLER.verifyOtp
)

/**
 * @swagger
 * /api/v1/auth/resend-verification-code:
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
  validationHandlingMiddleware({ body: AUTH_VALIDATION.resendVerificationCode }),
  AUTH_CONTROLLER.resendVerificationCode
)

/**
 * @swagger
 * /api/v1/auth/refresh-token:
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
  validationHandlingMiddleware({ body: AUTH_VALIDATION.refreshToken }),
  AUTH_CONTROLLER.refreshToken
)

/**
 * @swagger
 * /api/v1/auth/logout:
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
  validationHandlingMiddleware({ body: AUTH_VALIDATION.logout }),
  AUTH_CONTROLLER.logout
)

/**
 * @swagger
 * /api/v1/auth/logout-all:
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
export const AUTH_ROUTE = router