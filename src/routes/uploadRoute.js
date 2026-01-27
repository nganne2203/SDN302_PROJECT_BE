import express from 'express'
import { UPLOAD_CONTROLLER } from '#controllers/uploadController.js'
import upload from '#middlewares/uploadHandlingMiddleware.js'
import { authorizationMiddleware } from '#middlewares/authHandlingMiddleware.js'
import { apiRateLimiter, writeRateLimiter } from '#middlewares/rateLimitHandlingmiddleware.js'

const router = express.Router()

router.use(authorizationMiddleware)

/**
 * @swagger
 * /api/uploads/images:
 *   post:
 *     summary: Upload image to Cloudinary
 *     description: Nhận multipart/form-data với field `image`, trả về publicId và metadata.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload thành công
 *       400:
 *         description: Thiếu file hoặc file không hợp lệ
 */
router.post('/images',
  writeRateLimiter,
  upload.single('image'),
  UPLOAD_CONTROLLER.uploadImage
)

/**
 * @swagger
 * /api/uploads/multiple-images:
 *   post:
 *     summary: Upload multiple images to Cloudinary
 *     description: Nhận multipart/form-data với field `images`, tải nhiều ảnh cùng lúc (tối đa 10 ảnh).
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Upload thành công
 *       400:
 *         description: Thiếu file hoặc file không hợp lệ
 */
router.post('/multiple-images',
  writeRateLimiter,
  upload.array('images', 10),
  UPLOAD_CONTROLLER.uploadMultipleImages
)

/**
 * @swagger
 * /api/uploads/images/{publicId}:
 *   get:
 *     summary: Lấy thông tin ảnh
 *     description: Trả về thông tin ảnh theo publicId trên Cloudinary.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID của ảnh
 *     responses:
 *       200:
 *         description: Lấy thông tin ảnh thành công
 *       404:
 *         description: Không tìm thấy ảnh
 */
router.get('/images/:publicId',
  apiRateLimiter,
  UPLOAD_CONTROLLER.getImage
)

/**
 * @swagger
 * /api/uploads/images/{publicId}:
 *   delete:
 *     summary: Xóa ảnh trên Cloudinary
 *     description: Xóa ảnh bằng publicId và làm mới cache.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID của ảnh
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Ảnh không tồn tại
 */
router.delete('/images/:publicId',
  writeRateLimiter,
  UPLOAD_CONTROLLER.deleteImage
)

export const UPLOAD_ROUTE = router
