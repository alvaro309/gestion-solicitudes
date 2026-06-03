const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(process.env.DB_PATH || './src/database.sqlite');
const db = new Database(DB_PATH);

// Pragmas para rendimiento y FK support
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Crear tablas ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    correo      TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    rol         TEXT NOT NULL CHECK(rol IN ('solicitante','responsable','administrador')),
    activo      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activa      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS solicitudes (
    id              TEXT PRIMARY KEY,
    titulo          TEXT NOT NULL,
    descripcion     TEXT NOT NULL,
    estado          TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK(estado IN ('pendiente','en_proceso','cerrada')),
    prioridad       TEXT NOT NULL DEFAULT 'media'
                    CHECK(prioridad IN ('baja','media','alta')),
    solicitante_id  TEXT NOT NULL REFERENCES usuarios(id),
    responsable_id  TEXT REFERENCES usuarios(id),
    categoria_id    TEXT REFERENCES categorias(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at       TEXT
  );

  CREATE TABLE IF NOT EXISTS comentarios (
    id            TEXT PRIMARY KEY,
    contenido     TEXT NOT NULL,
    solicitud_id  TEXT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    autor_id      TEXT NOT NULL REFERENCES usuarios(id),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Seed: usuarios iniciales ──────────────────────────────────────────────────
const seedUsuarios = () => {
  const existe = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get('admin@unal.edu.co');
  if (existe) return;

  const insert = db.prepare(`
    INSERT INTO usuarios (id, nombre, correo, password, rol)
    VALUES (?, ?, ?, ?, ?)
  `);

  const usuarios = [
    { id: 'usr-001', nombre: 'Administrador Sistema', correo: 'admin@unal.edu.co',      rol: 'administrador' },
    { id: 'usr-002', nombre: 'Álvaro Nieto',          correo: 'anietoo@unal.edu.co',    rol: 'solicitante'   },
    { id: 'usr-003', nombre: 'Carlos Responsable',    correo: 'cresponsable@unal.edu.co', rol: 'responsable' },
  ];

  for (const u of usuarios) {
    const hash = bcrypt.hashSync('Password123!', 10);
    insert.run(u.id, u.nombre, u.correo, hash, u.rol);
  }
  console.log('✅ Usuarios seed creados');
};

// ── Seed: categorías ──────────────────────────────────────────────────────────
const seedCategorias = () => {
  const existe = db.prepare('SELECT id FROM categorias LIMIT 1').get();
  if (existe) return;

  const insert = db.prepare(`
    INSERT INTO categorias (id, nombre, descripcion)
    VALUES (?, ?, ?)
  `);

  const cats = [
    ['cat-001', 'Soporte Técnico',   'Problemas con equipos o software'],
    ['cat-002', 'Recursos',          'Solicitud de materiales o equipos'],
    ['cat-003', 'Permisos',          'Permisos y autorizaciones internas'],
    ['cat-004', 'Capacitación',      'Solicitudes de formación y cursos'],
    ['cat-005', 'Infraestructura',   'Mejoras o reparaciones de instalaciones'],
  ];

  for (const [id, nombre, descripcion] of cats) {
    insert.run(id, nombre, descripcion);
  }
  console.log('✅ Categorías seed creadas');
};

seedUsuarios();
seedCategorias();

module.exports = db;
