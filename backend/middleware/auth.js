const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware untuk memvalidasi JWT Token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const secret = process.env.JWT_SECRET || 'default-fallback-secret-key';
    const decoded = jwt.verify(token, secret);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan atau token sudah tidak valid.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kedaluwarsa. Silakan login kembali.',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
};

module.exports = authenticateToken;
