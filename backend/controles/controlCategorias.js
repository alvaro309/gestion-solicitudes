const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// GET /api/categorias  — HU-20
const listar = (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias WHERE activa = 1 ORDER BY nombre').all();
  res.json({ categorias });
};

// POST /api/categorias (administrador)
const crear = (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  const existe = db.prepare('SELECT id FROM categorias WHERE nombre = ?').get(nombre);
  if (existe) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });

  const id = uuidv4();
  db.prepare('INSERT INTO categorias (id, nombre, descripcion) VALUES (?, ?, ?)').run(id, nombre, descripcion || null);
  const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id);
  res.status(201).json({ mensaje: 'Categoría creada', categoria });
};

module.exports = { listar, crear };
