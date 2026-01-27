import { UPLOAD_SERVICE } from '#services/uploadService.js'
import { responseSuccess } from '#utils/responseUtil.js'
import { StatusCodes } from 'http-status-codes'

const uploadImage = async (req, res, next) => {
  try {
    const result = await UPLOAD_SERVICE.uploadImage(req.file)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: 'Tải ảnh thành công'
    }))
  } catch (error) { next(error) }
}

const getImage = async (req, res, next) => {
  try {
    const result = await UPLOAD_SERVICE.getImage(req.params.publicId)
    res.status(StatusCodes.OK).json(responseSuccess({
      data: result,
      message: 'Lấy thông tin ảnh thành công'
    }))
  } catch (error) { next(error) }
}

const uploadMultipleImages = async (req, res, next) => {
  try {
    const result = await UPLOAD_SERVICE.uploadMultipleImages(req.files)
    res.status(StatusCodes.CREATED).json(responseSuccess({
      data: result,
      message: `Tải ${result.length} ảnh thành công`
    }))
  } catch (error) { next(error) }
}

const deleteImage = async (req, res, next) => {
  try {
    await UPLOAD_SERVICE.deleteImage(req.params.publicId)
    res.status(StatusCodes.OK).json(responseSuccess({
      message: 'Xóa ảnh thành công'
    }))
  } catch (error) { next(error) }
}

export const UPLOAD_CONTROLLER = {
  uploadImage,
  uploadMultipleImages,
  getImage,
  deleteImage
}
