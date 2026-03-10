import { cloudinary, uploadToCloudinary } from '#middlewares/uploadHandlingMiddleware.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import { env } from '#configs/environment.js'

const buildImageUrl = (publicId) => {
  if (!publicId) return null
  const fullPublicId = publicId.includes('/') ? publicId : `uploads/${publicId}`
  return `https://res.cloudinary.com/${env.CLOUD_NAME}/image/upload/${fullPublicId}`
}

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
    // If publicId has no folder separator, prepend 'uploads/' for backward compatibility
    const fullPublicId = publicId.includes('/') ? publicId : `uploads/${publicId}`
    const resource = await cloudinary.api.resource(fullPublicId, { resource_type: 'image' })
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
    // If publicId has no folder separator, prepend 'uploads/' for backward compatibility
    const fullPublicId = publicId.includes('/') ? publicId : `uploads/${publicId}`
    const result = await cloudinary.uploader.destroy(fullPublicId, { invalidate: true })
    if (['ok', 'not found'].includes(result.result)) {
      return true
    }
  } catch {
    throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Không thể xóa ảnh trên Cloudinary'])
  }

  throw new ApiError(ERROR_CODES.SERVER_ERROR, ['Xóa ảnh không thành công'])
}

const deleteImagesFromCloudinary = async (images) => {
  if (!images || images.length === 0) {
    return { deletedCount: 0, failedCount: 0 }
  }

  const publicIds = images.map(img =>
    typeof img === 'string' ? img : img.publicId
  ).filter(Boolean)

  if (publicIds.length === 0) {
    return { deletedCount: 0, failedCount: 0 }
  }

  const results = await Promise.allSettled(
    publicIds.map(publicId => deleteImage(publicId))
  )

  const deletedCount = results.filter(r => r.status === 'fulfilled').length
  const failedCount = results.filter(r => r.status === 'rejected').length

  return { deletedCount, failedCount }
}

export const UPLOAD_SERVICE = {
  uploadImage,
  uploadMultipleImages,
  getImage,
  deleteImage,
  deleteImagesFromCloudinary,
  buildImageUrl
}

