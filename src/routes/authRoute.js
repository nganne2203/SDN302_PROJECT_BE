import express from 'express'
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
 *     responses:
 *       201:
 *         description: Register successfully
 *       409:
 *         description: Email already exists
 */
router.post('/register',
  createRateLimiter,
  validationHandlingMiddleware(AUTH_VALIDATION.registerUser),
  sanitizeRequest(REGISTER_FIELDS, REQUIRE_FIELD),
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
router.post('/login',
  createRateLimiter,
  validationHandlingMiddleware(AUTH_VALIDATION.loginUser),
  sanitizeRequest(LOGIN_FIELDS, LOGIN_FIELDS),
  AUTH_CONTROLLER.login
)

export const AUTH_ROUTE = router