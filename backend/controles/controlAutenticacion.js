const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');

// POST /api/auth/login  — HU-11
const login = (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ? AND activo = 1').get(correo);
  if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valido = bcrypt.compareSync(password, usuario.password);
  if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
  });
};

// GET /api/auth/me
const me = (req, res) => {
  res.json({ usuario: req.usuario });
};

module.exports = { login, me };
