const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// 角色验证中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// 管理员权限验证
const requireAdmin = requireRole(['admin']);

// 管理员或客服权限验证
const requireAdminOrSupport = requireRole(['admin', 'support']);

// 记录操作日志
const logAction = async (userId, action, details = {}, ipAddress = null, userAgent = null) => {
  try {
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, action, JSON.stringify(details), ipAddress, userAgent]);
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

// 检查用户权限
const checkPermission = async (userId, permission) => {
  try {
    const result = await query(`
      SELECT permissions 
      FROM users 
      WHERE id = ? AND status = 'active'
    `, [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    const permissions = result.rows[0].permissions;
    const parsedPermissions = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
    return parsedPermissions[permission] === true;
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
};

// 权限验证中间件
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await checkPermission(req.user.userId, permission);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Permission '${permission}' required` 
        });
      }
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// 速率限制中间件（简单实现）
const rateLimitMap = new Map();

const rateLimit = (windowMs = 60000, max = 100) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const limit = rateLimitMap.get(key);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }

    if (limit.count >= max) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      });
    }

    limit.count++;
    next();
  };
};

// 清理过期的速率限制记录
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAdminOrSupport,
  requirePermission,
  checkPermission,
  logAction,
  rateLimit
}; 