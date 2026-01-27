import { cloudinary, uploadToCloudinary } from '#middlewares/uploadHandlingMiddleware.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'

const uploadImage = async (file) => {
  if (!file) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không tìm thấy file tải lên'])
  }

  try {
    const result = await uploadToCloudinary(file.buffer, 'uploads')
    return {
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    }
  } catch {
    throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Không thể tải ảnh lên Cloudinary'])
  }
}

const getImage = async (publicId) => {
  if (!publicId) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Thiếu publicId của ảnh'])
  }

  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'image' })
    return {
      imageUrl: resource.secure_url,
      publicId: resource.public_id,
      format: resource.format,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      createdAt: resource.created_at
    }
  } catch (error) {
    if (error?.error?.http_code === 404) {
      throw new ApiError(ERROR_CODES.NOT_FOUND, ['Ảnh không tồn tại hoặc đã bị xóa'])
    }
    throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Không thể lấy thông tin ảnh'])
  }
}

const uploadMultipleImages = async (files) => {
  if (!files || files.length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Không tìm thấy file tải lên'])
  }

  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, 'uploads'))
    const results = await Promise.all(uploadPromises)

    return results.map(result => ({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    }))
  } catch {
    throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Không thể tải ảnh lên Cloudinary'])
  }
}

const deleteImage = async (publicId) => {
  if (!publicId) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Thiếu publicId của ảnh cần xóa'])
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
    if (['ok', 'not found'].includes(result.result)) {
      return true
    }
  } catch {
    throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Không thể xóa ảnh trên Cloudinary'])
  }

  throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Xóa ảnh không thành công'])
}

export const UPLOAD_SERVICE = {
  uploadImage,
  uploadMultipleImages,
  getImage,
  deleteImage
}

