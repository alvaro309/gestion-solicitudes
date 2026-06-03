const jwt = require('jsonwebtoken');
const db  = require('../config/database');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = db.prepare('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ? AND activo = 1').get(payload.id);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware de rol: uso → requireRol('administrador') o requireRol('administrador','responsable')
const requireRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};

module.exports = { authMiddleware, requireRol };
