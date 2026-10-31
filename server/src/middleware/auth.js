import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

export const AUTH_COOKIE = 'token';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    expires: new Date(exp * 1000),
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, sameSite: 'lax', secure: config.isProd, path: '/' });
}

/** Accepts the JWT from the httpOnly cookie (browser) or an `Authorization: Bearer` header (API clients). */
export function requireAuth(req, _res, next) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[AUTH_COOKIE];
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in');
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
  } catch {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again');
  }
  next();
}
