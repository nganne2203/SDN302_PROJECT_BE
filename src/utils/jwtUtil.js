import jwt from 'jsonwebtoken';
import { env } from '#configs/environment.js';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

const generateRefreshToken = (payload) => {
  const minimalPayload = { id: payload.id };
  return jwt.sign(minimalPayload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
}

const generateToken = (accessPayload, refreshPayload = null) => {
  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken(refreshPayload || accessPayload),
  }
}

export const JWT_UTILS = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateToken,
}

