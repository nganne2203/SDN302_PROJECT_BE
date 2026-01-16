import joi from 'joi'
import {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX
} from '#constants/pattern.js'

export const AUTH_VALIDATION = {
  registerUser: joi.object({
    fullname: joi.string().required(),
    email: joi.string().email().required().pattern(EMAIL_REGEX),
    password: joi.string().pattern(PASSWORD_REGEX).required(),
    phone: joi.string().pattern(PHONE_REGEX).length(10).optional(),
    address: joi.object({
      fullname: joi.string().required(),
      phone: joi.string().pattern(PHONE_REGEX).length(10).required(),
      addressLine: joi.string().required(),
      city: joi.string().required(),
      district: joi.string().required(),
      ward: joi.string().required(),
      isDefault: joi.boolean().optional().default(false)
    }).optional(),
    avatar: joi.string().uri().optional()
  }),
  loginUser: joi.object({
    email: joi.string().email().required().pattern(EMAIL_REGEX),
    password: joi.string().required()
  })
}