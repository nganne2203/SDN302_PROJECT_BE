import express from 'express'
import { USER_CONTROLLER } from '#controllers/userController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import {
  CREATE_USER_FIELDS,
  REQUIRE_FIELD_CREATE_USER,
  UPDATE_CURRENT_USER_FIELDS,
  UPDATE_USER_FIELDS
} from '#constants/userConstant.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { apiRateLimiter, writeRateLimiter } from '#middlewares/rateLimitHandlingmiddleware.js'
import { USER_VALIDATION } from '#validations/userValidation.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'

const router = express.Router()
router.use(authorizationMiddleware)

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users with optional filtering, pagination, and sorting.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users by name, email, or phone
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter users by active status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *         description: Sort order, either 'asc' or 'desc'
 *     responses:
 *       201:
 *         description: Register successfully
 *       409:
 *         description: Email already exists
 */
router.get('/',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ query: USER_VALIDATION.query }),
  USER_CONTROLLER.getAllUsers
)

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
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
 *               - role
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
 *               role:
 *                type: string
 *                enum: [admin, manager, staff, customer]
 *                example: customer
 *               branch:
 *                 type: string
 *                 example: '60d0fe4f5311236168a109ca'
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fullname:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     addressLine:
 *                       type: string
 *                     city:
 *                       type: string
 *                     district:
 *                       type: string
 *                     ward:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *                 example:
 *                   - fullname: 'Mai Thi Thanh Ngan'
 *                     phone: '0123456789'
 *                     addressLine: '123 Le Loi'
 *                     city: 'Ho Chi Minh'
 *                     district: 'District 1'
 *                     ward: 'Ben Nghe'
 *                     isDefault: true
 *               avatar:
 *                 type: string
 *                 format: url
 *                 example: 'http://example.com/avatar.jpg'
 *     responses:
 *       201:
 *         description: Created successfully
 */
router.post('/',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  sanitizeRequest(CREATE_USER_FIELDS, REQUIRE_FIELD_CREATE_USER),
  validationHandlingMiddleware({ body: USER_VALIDATION.createUser }),
  USER_CONTROLLER.createUser
)

/**
 * @swagger
 * /api/users/manager:
 *   get:
 *     summary: Get all users for manager
 *     description: Retrieve a list of users with optional filtering, pagination, and sorting.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users by name, email, or phone
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter users by active status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
*           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *         description: Sort order, either 'asc' or 'desc'
 *     responses:
 *       200:
 *         description: Get successfully
 */
router.get('/manager',
  apiRateLimiter,
  requireRoles(RoleEnum.MANAGER),
  validationHandlingMiddleware({ query: USER_VALIDATION.query }),
  USER_CONTROLLER.getAllUsersForManager
)

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the profile of the currently authenticated user.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: example@gmail.com
 *               phone:
 *                 type: string
 *                 example: '0123456789'
 *               avatar:
 *                 type: string
 *                 format: url
 *                 example: 'http://example.com/avatar.jpg'
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fullname:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     addressLine:
 *                       type: string
 *                     city:
 *                       type: string
 *                     district:
 *                       type: string
 *                     ward:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *                 example:
 *                   - fullname: 'Mai Thi Thanh Ngan'
 *                     phone: '0123456789'
 *                     addressLine: '123 Le Loi'
 *                     city: 'Ho Chi Minh'
 *                     district: 'District 1'
 *                     ward: 'Ben Nghe'
 *                     isDefault: true
 *     responses:
 *       200:
 *         description: Update successfully
 */
router.put('/me',
  apiRateLimiter,
  sanitizeRequest(UPDATE_CURRENT_USER_FIELDS, []),
  validationHandlingMiddleware({ body: USER_VALIDATION.updateCurrentUser }),
  USER_CONTROLLER.updateCurrentUser
)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a user by their unique ID.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     responses:
 *       200:
 *         description: Get successfully
 */
router.get('/:id',
  apiRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  validationHandlingMiddleware({ params: USER_VALIDATION.idParam }),
  USER_CONTROLLER.getUserById
)

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Update a user's information by their unique ID.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: example@gmail.com
 *               phone:
 *                 type: string
 *                 example: '0123456789'
 *               role:
 *                 type: string
 *                 enum: [admin, manager, staff, customer]
 *                 example: customer
 *               branch:
 *                 type: string
 *                 example: '60d0fe4f5311236168a109ca'
 *               avatar:
 *                 type: string
 *                 format: url
 *                 example: 'http://example.com/avatar.jpg'
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fullname:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     addressLine:
 *                       type: string
 *                     city:
 *                       type: string
 *                     district:
 *                       type: string
 *                     ward:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *                 example:
 *                   - fullname: 'Mai Thi Thanh Ngan'
 *                     phone: '0123456789'
 *                     addressLine: '123 Le Loi'
 *                     city: 'Ho Chi Minh'
 *                     district: 'District 1'
 *                     ward: 'Ben Nghe'
 *                     isDefault: true
 *     responses:
 *       200:
 *         description: Update successfully
 */
router.put('/:id',
  writeRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.STAFF),
  sanitizeRequest(UPDATE_USER_FIELDS, []),
  validationHandlingMiddleware({
    params: USER_VALIDATION.idParam,
    body: USER_VALIDATION.updateUser
  }),
  USER_CONTROLLER.updateUser
)

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Update user status by ID
 *     description: Update a user's active status by their unique ID.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Update successfully
 */
router.put('/:id/status',
  writeRateLimiter,
  requireRoles(RoleEnum.ADMIN, RoleEnum.MANAGER),
  validationHandlingMiddleware({
    params: USER_VALIDATION.idParam,
    body: USER_VALIDATION.updateUserStatus
  }),
  USER_CONTROLLER.updateUserStatus
)

export const USER_ROUTE = router