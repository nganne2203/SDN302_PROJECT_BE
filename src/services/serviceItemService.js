import { SERVICE_REPOSITORY } from '#repositories/serviceRepository.js'
import ApiError from '#utils/ApiError.js'
import { ERROR_CODES } from '#constants/errorCode.js'

const getServiceDetails = async (serviceId) => {
  const service = await SERVICE_REPOSITORY.getServiceById(serviceId)
  if (!service) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, ['Dịch vụ không tồn tại'])
  }
  return service
}

export const SERVICE_ITEM_SERVICE = {
  getServiceDetails
}