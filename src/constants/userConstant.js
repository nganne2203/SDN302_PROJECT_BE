export const RoleEnum = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
}

export const USER_PROVIDER = {
  LOCAL: 'local',
  GOOGLE: 'google'
}

export const LOGIN_FIELDS = [
  'email',
  'password',
  'captchaToken'
]

export const REGISTER_FIELDS = [
  'fullname',
  'email',
  'password',
  'phone',
  'address',
  'avatar'
]

export const REQUIRE_FIELD = [
  'fullname',
  'email',
  'password',
  'phone'
]