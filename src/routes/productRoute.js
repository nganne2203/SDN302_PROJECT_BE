import express from 'express'
import { PRODUCT_CONTROLLER } from '#controllers/productController.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter } from '#middlewares/rateLimitHandlingmiddleware.js'
import { sanitizeRequest } from '#middlewares/sanitizeRequestMiddleware.js'
import { requireRoles } from '#middlewares/policiesHandlingMiddleware.js'
import { RoleEnum } from '#constants/roleConstant.js'
import { validationHandlingMiddleware } from '#middlewares/validationHandlingMiddleware.js'
import { PRODUCT_VALIDATION } from '#validations/productValidation.js'
import {
  CREATE_PRODUCT_FIELDS,
  CREATE_PRODUCT_REQUIRED,
  UPDATE_PRODUCT_FIELDS,
  UPDATE_PRODUCT_STATUS_FIELDS
} from '#constants/productConstant.js'

const router = express.Router()

router.get(
  '/',
  apiRateLimiter,
  validationHandlingMiddleware({ query: PRODUCT_VALIDATION.query }),
  PRODUCT_CONTROLLER.getAllProducts
)

router.get(
  '/search',
  apiRateLimiter,
  validationHandlingMiddleware({ query: PRODUCT_VALIDATION.searchQuery }),
  PRODUCT_CONTROLLER.searchProducts
)

router.get(
  '/categories',
  apiRateLimiter,
  PRODUCT_CONTROLLER.getProductCategories
)

router.get(
  '/:id',
  apiRateLimiter,
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.idParam }),
  PRODUCT_CONTROLLER.getProductById
)

router.post(
  '/',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(CREATE_PRODUCT_FIELDS, CREATE_PRODUCT_REQUIRED),
  validationHandlingMiddleware({ body: PRODUCT_VALIDATION.createProduct }),
  PRODUCT_CONTROLLER.createProduct
)

router.put(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_PRODUCT_FIELDS, []),
  validationHandlingMiddleware({
    params: PRODUCT_VALIDATION.idParam,
    body: PRODUCT_VALIDATION.updateProduct
  }),
  PRODUCT_CONTROLLER.updateProduct
)

router.patch(
  '/:id/status',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  sanitizeRequest(UPDATE_PRODUCT_STATUS_FIELDS, UPDATE_PRODUCT_STATUS_FIELDS),
  validationHandlingMiddleware({
    params: PRODUCT_VALIDATION.idParam,
    body: PRODUCT_VALIDATION.updateProductStatus
  }),
  PRODUCT_CONTROLLER.updateProductStatus
)

router.delete(
  '/:id',
  apiRateLimiter,
  authorizationMiddleware,
  requireRoles(RoleEnum.ADMIN),
  validationHandlingMiddleware({ params: PRODUCT_VALIDATION.idParam }),
  PRODUCT_CONTROLLER.deleteProductById
)

export const PRODUCT_ROUTE = router
