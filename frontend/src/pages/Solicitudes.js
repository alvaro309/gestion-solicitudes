import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ESTADOS = { pendiente: '#f39c12', en_proceso: '#2980b9', cerrada: '#27ae60' };
const LABELS  = { pendiente: 'Pendiente', en_proceso: 'En Proceso', cerrada: 'Cerrada' };

export default function Solicitudes() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes]   = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando]         = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = filtroEstado ? `?estado=${filtroEstado}` : '';
      const res = await api.get(`/solicitudes${params}`);
      setSolicitudes(res.data.solicitudes);
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navTitle}>Gestión de Solicitudes</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#fff' }}>{usuario?.nombre} · <b>{usuario?.rol}</b></span>
          <button onClick={logout} style={styles.logoutBtn}>Salir</button>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <h2 style={styles.h2}>Mis Solicitudes</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* HU-09: filtro por estado */}
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={styles.select}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="cerrada">Cerrada</option>
            </select>
            {/* HU-01 */}
            <button onClick={() => navigate('/solicitudes/nueva')} style={styles.btn}>
              + Nueva Solicitud
            </button>
          </div>
        </div>

        {/* Lista */}
        {cargando ? (
          <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Cargando...</p>
        ) : solicitudes.length === 0 ? (
          <div style={styles.empty}>
            <p>No hay solicitudes{filtroEstado ? ` con estado "${LABELS[filtroEstado]}"` : ''}.</p>
            <button onClick={() => navigate('/solicitudes/nueva')} style={styles.btn}>Crear primera solicitud</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {solicitudes.map(s => (
              <div key={s.id} style={styles.card} onClick={() => navigate(`/solicitudes/${s.id}`)}>
                <div style={styles.cardHeader}>
                  <code style={styles.idBadge}>{s.id}</code>
                  <span style={{ ...styles.estadoBadge, background: ESTADOS[s.estado] }}>
                    {LABELS[s.estado]}
                  </span>
                </div>
                <h3 style={styles.cardTitle}>{s.titulo}</h3>
                <p style={styles.cardDesc}>{s.descripcion.substring(0, 100)}{s.descripcion.length > 100 ? '…' : ''}</p>
                <div style={styles.cardFooter}>
                  <span>{s.categoria_nombre || 'Sin categoría'}</span>
                  <span>{new Date(s.created_at).toLocaleDateString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:        { minHeight: '100vh', background: '#f0f4f8' },
  nav:         { background: '#1a3c6e', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navTitle:    { color: '#fff', fontWeight: 700, fontSize: 18 },
  logoutBtn:   { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  content:     { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  toolbar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h2:          { margin: 0, color: '#1a3c6e', fontSize: 22 },
  select:      { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  btn:         { padding: '9px 18px', background: '#1a3c6e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  empty:       { textAlign: 'center', padding: 60, color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card:        { background: '#fff', borderRadius: 12, padding: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'box-shadow 0.2s' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  idBadge:     { fontSize: 12, background: '#eef2ff', color: '#3730a3', padding: '3px 8px', borderRadius: 4 },
  estadoBadge: { color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 600 },
  cardTitle:   { margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' },
  cardDesc:    { margin: '0 0 16px', fontSize: 14, color: '#666', lineHeight: 1.5 },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' },
};
