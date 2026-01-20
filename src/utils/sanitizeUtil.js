const sanitize = (data = {}) => {
  const cloned = { ...data }
  delete cloned.password
  delete cloned.refreshToken
  delete cloned.accessToken
  delete cloned.otp
  return cloned
}

export default sanitize