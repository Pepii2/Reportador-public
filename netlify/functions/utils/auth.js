const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const authenticateRequest = (headers) => {
  const authHeader = headers.authorization || headers.Authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
};

module.exports = {
  verifyToken,
  generateToken,
  authenticateRequest
};