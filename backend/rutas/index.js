const router = require('express').Router();
const { authMiddleware, requireRol } = require('../middleware/auth');

const authCtrl         = require('../controles/controlAutenticacion');
const solicitudesCtrl  = require('../controles/controlSolicitudes');
const comentariosCtrl  = require('../controles/controlComentarios');
const categoriasCtrl   = require('../controles/controlCategorias');

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authMiddleware, authCtrl.me);

// ── Solicitudes ───────────────────────────────────────────────────────────────
router.post('/solicitudes',          authMiddleware, solicitudesCtrl.crear);
router.get('/solicitudes',           authMiddleware, solicitudesCtrl.listar);
router.get('/solicitudes/:id',       authMiddleware, solicitudesCtrl.obtener);
router.put('/solicitudes/:id',       authMiddleware, solicitudesCtrl.editar);
router.patch('/solicitudes/:id/cerrar',
  authMiddleware, requireRol('administrador'), solicitudesCtrl.cerrar);
router.patch('/solicitudes/:id/estado',
  authMiddleware, requireRol('administrador','responsable'), solicitudesCtrl.cambiarEstado);

// ── Comentarios ───────────────────────────────────────────────────────────────
router.post('/solicitudes/:id/comentarios', authMiddleware, comentariosCtrl.agregar);
router.get('/solicitudes/:id/comentarios',  authMiddleware, comentariosCtrl.listar);

// ── Categorías ────────────────────────────────────────────────────────────────
router.get('/categorias',  authMiddleware, categoriasCtrl.listar);
router.post('/categorias', authMiddleware, requireRol('administrador'), categoriasCtrl.crear);

module.exports = router;
