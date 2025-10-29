import jwt from 'jsonwebtoken';

// JWT secrets from environment variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-here';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here';

/**
 * Generate JWT access token
 * Expires in 1 hour
 * @param userId - User ID
 * @param email - User email
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'access',
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: '1h', // 1 hour
    }
  );
}

/**
 * Generate JWT refresh token
 * Expires in 7 days
 * @param userId - User ID
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d', // 7 days
    }
  );
}

/**
 * Verify JWT access token
 * @param token - JWT token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): { userId: string; email: string; type: string } {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify JWT refresh token
 * @param token - JWT token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): { userId: string; type: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as {
      userId: string;
      type: string;
    };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
