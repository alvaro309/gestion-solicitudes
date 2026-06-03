const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// ── HU-01 + HU-02: Crear solicitud con ID único ───────────────────────────────
const crear = (req, res) => {
  const { titulo, descripcion, prioridad = 'media', categoria_id } = req.body;
  if (!titulo || !descripcion) {
    return res.status(400).json({ error: 'Título y descripción son requeridos' });
  }

  // Validar categoría si se envía
  if (categoria_id) {
    const cat = db.prepare('SELECT id FROM categorias WHERE id = ? AND activa = 1').get(categoria_id);
    if (!cat) return res.status(400).json({ error: 'Categoría no válida' });
  }

  const id = `SOL-${uuidv4().split('-')[0].toUpperCase()}`; // Ej: SOL-A3F2B1C4
  db.prepare(`
    INSERT INTO solicitudes (id, titulo, descripcion, prioridad, solicitante_id, categoria_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, titulo, descripcion, prioridad, req.usuario.id, categoria_id || null);

  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
  res.status(201).json({ mensaje: 'Solicitud registrada exitosamente', solicitud });
};

// ── HU-05 + HU-12: Ver solicitudes (historial) ────────────────────────────────
const listar = (req, res) => {
  const { estado, categoria_id } = req.query;
  const { rol, id: userId } = req.usuario;

  let sql = `
    SELECT s.*, 
           u1.nombre AS solicitante_nombre,
           u2.nombre AS responsable_nombre,
           c.nombre  AS categoria_nombre
    FROM solicitudes s
    LEFT JOIN usuarios  u1 ON s.solicitante_id  = u1.id
    LEFT JOIN usuarios  u2 ON s.responsable_id  = u2.id
    LEFT JOIN categorias c ON s.categoria_id    = c.id
    WHERE 1=1
  `;
  const params = [];

  // Solicitante solo ve las suyas — HU-12
  if (rol === 'solicitante') {
    sql += ' AND s.solicitante_id = ?';
    params.push(userId);
  }

  // Filtro por estado — HU-09
  if (estado && ['pendiente','en_proceso','cerrada'].includes(estado)) {
    sql += ' AND s.estado = ?';
    params.push(estado);
  }

  // Filtro por categoría
  if (categoria_id) {
    sql += ' AND s.categoria_id = ?';
    params.push(categoria_id);
  }

  sql += ' ORDER BY s.created_at DESC';

  const solicitudes = db.prepare(sql).all(...params);
  res.json({ total: solicitudes.length, solicitudes });
};

// GET /api/solicitudes/:id
const obtener = (req, res) => {
  const { rol, id: userId } = req.usuario;
  const solicitud = db.prepare(`
    SELECT s.*,
           u1.nombre AS solicitante_nombre,
           u2.nombre AS responsable_nombre,
           c.nombre  AS categoria_nombre
    FROM solicitudes s
    LEFT JOIN usuarios  u1 ON s.solicitante_id = u1.id
    LEFT JOIN usuarios  u2 ON s.responsable_id = u2.id
    LEFT JOIN categorias c ON s.categoria_id   = c.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

  // Solicitante solo puede ver las suyas
  if (rol === 'solicitante' && solicitud.solicitante_id !== userId) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  // Incluir comentarios
  const comentarios = db.prepare(`
    SELECT co.*, u.nombre AS autor_nombre
    FROM comentarios co
    JOIN usuarios u ON co.autor_id = u.id
    WHERE co.solicitud_id = ?
    ORDER BY co.created_at ASC
  `).all(req.params.id);

  res.json({ ...solicitud, comentarios });
};

// ── HU-18: Editar solicitud pendiente ─────────────────────────────────────────
const editar = (req, res) => {
  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

  // Solo el solicitante puede editar la suya
  if (solicitud.solicitante_id !== req.usuario.id) {
    return res.status(403).json({ error: 'Solo puedes editar tus propias solicitudes' });
  }

  if (solicitud.estado !== 'pendiente') {
    return res.status(400).json({ error: 'Solo se pueden editar solicitudes en estado pendiente' });
  }

  const { titulo, descripcion, prioridad, categoria_id } = req.body;
  db.prepare(`
    UPDATE solicitudes
    SET titulo       = COALESCE(?, titulo),
        descripcion  = COALESCE(?, descripcion),
        prioridad    = COALESCE(?, prioridad),
        categoria_id = COALESCE(?, categoria_id),
        updated_at   = datetime('now')
    WHERE id = ?
  `).run(titulo || null, descripcion || null, prioridad || null, categoria_id || null, req.params.id);

  const actualizada = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(req.params.id);
  res.json({ mensaje: 'Solicitud actualizada', solicitud: actualizada });
};

// ── HU-14: Cerrar solicitud (administrador) ───────────────────────────────────
const cerrar = (req, res) => {
  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (solicitud.estado === 'cerrada') {
    return res.status(400).json({ error: 'La solicitud ya está cerrada' });
  }

  db.prepare(`
    UPDATE solicitudes
    SET estado     = 'cerrada',
        updated_at = datetime('now'),
        closed_at  = datetime('now')
    WHERE id = ?
  `).run(req.params.id);

  res.json({ mensaje: 'Solicitud cerrada exitosamente' });
};

// Cambiar estado (administrador/responsable)
const cambiarEstado = (req, res) => {
  const { estado } = req.body;
  if (!['pendiente','en_proceso','cerrada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  const solicitud = db.prepare('SELECT id FROM solicitudes WHERE id = ?').get(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

  db.prepare(`
    UPDATE solicitudes
    SET estado     = ?,
        updated_at = datetime('now'),
        closed_at  = CASE WHEN ? = 'cerrada' THEN datetime('now') ELSE closed_at END
    WHERE id = ?
  `).run(estado, estado, req.params.id);

  res.json({ mensaje: `Estado actualizado a "${estado}"` });
};

module.exports = { crear, listar, obtener, editar, cerrar, cambiarEstado };
