require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes = require('../rutas');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api', routes);

// 404
app.use((_, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 API disponible en http://localhost:${PORT}/api`);
  console.log(`\nUsuarios de prueba:`);
  console.log(`  admin@unal.edu.co       → administrador`);
  console.log(`  anietoo@unal.edu.co     → solicitante`);
  console.log(`  cresponsable@unal.edu.co → responsable`);
  console.log(`  Password: Password123!\n`);
});

module.exports = app;
