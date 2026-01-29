import { serviceModel } from '#models/serviceModel.js'

const getServiceById = async (serviceId) => {
  return await serviceModel.findById(serviceId).exec()
}

export const SERVICE_REPOSITORY = {
  getServiceById
}