import express from 'express'
import passport from '#configs/passport.js'
import { AUTH_CONTROLLER } from '#controllers/authController.js'
import { createRateLimiter } from '#middlewares/rateLimitHandlingmiddleware.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { AUTH_VALIDATION } from '#validations/authValidation.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import {
  REGISTER_FIELDS,
  LOGIN_FIELDS,
  REQUIRE_FIELD
} from '#constants/userConstant.js'
import { verifyRecaptchaMiddleware } from '#middlewares/verifyCaptchaMiddleware.js'

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
 *               - address
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
 *               address:
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
  createRateLimiter,
  verifyRecaptchaMiddleware,
  sanitizeRequest(REGISTER_FIELDS, REQUIRE_FIELD),
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
  createRateLimiter,
  verifyRecaptchaMiddleware,
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
  createRateLimiter,
  AUTH_CONTROLLER.verifyOtp
)

export const AUTH_ROUTE = router