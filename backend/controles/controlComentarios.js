const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// POST /api/solicitudes/:id/comentarios  — HU-13
const agregar = (req, res) => {
  const { contenido } = req.body;
  if (!contenido || !contenido.trim()) {
    return res.status(400).json({ error: 'El contenido del comentario es requerido' });
  }

  const solicitud = db.prepare('SELECT id FROM solicitudes WHERE id = ?').get(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO comentarios (id, contenido, solicitud_id, autor_id)
    VALUES (?, ?, ?, ?)
  `).run(id, contenido.trim(), req.params.id, req.usuario.id);

  const comentario = db.prepare(`
    SELECT co.*, u.nombre AS autor_nombre
    FROM comentarios co
    JOIN usuarios u ON co.autor_id = u.id
    WHERE co.id = ?
  `).get(id);

  res.status(201).json({ mensaje: 'Comentario agregado', comentario });
};

// GET /api/solicitudes/:id/comentarios
const listar = (req, res) => {
  const solicitud = db.prepare('SELECT id FROM solicitudes WHERE id = ?').get(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

  const comentarios = db.prepare(`
    SELECT co.*, u.nombre AS autor_nombre
    FROM comentarios co
    JOIN usuarios u ON co.autor_id = u.id
    WHERE co.solicitud_id = ?
    ORDER BY co.created_at ASC
  `).all(req.params.id);

  res.json({ comentarios });
};

module.exports = { agregar, listar };
