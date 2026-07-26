import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-only-insecure-secret-change-me');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production. Set it in your .env file (see .env.example).');
}
const TOKEN_EXPIRY = '7d';

// Sign a new JWT token
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify a JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get the authenticated user from cookies or headers
export async function getAuthenticatedUser(request) {
  let token = null;

  // 1. Try to get token from request cookies
  if (request && typeof request.cookies?.get === 'function') {
    const cookieToken = request.cookies.get('token');
    if (cookieToken) {
      token = cookieToken.value;
    }
  }

  // 2. Try to get token from Next.js server context cookies
  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get('token');
      if (cookieToken) {
        token = cookieToken.value;
      }
    } catch (e) {
      // Cookies not available (e.g. in some static rendering contexts)
    }
  }

  // 3. Try to get token from Authorization header
  if (!token && request && typeof request.headers?.get === 'function') {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return null;
  }

  // Fetch current user from database
  try {
    const user = db.prepare('SELECT id, email, name, role, active, email_verified FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.active) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }
}
