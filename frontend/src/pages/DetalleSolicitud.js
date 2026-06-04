import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ESTADOS = { pendiente: '#f39c12', en_proceso: '#2980b9', cerrada: '#27ae60' };
const LABELS  = { pendiente: 'Pendiente', en_proceso: 'En Proceso', cerrada: 'Cerrada' };

export default function DetalleSolicitud() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [solicitud, setSolicitud]     = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [editando, setEditando]       = useState(false);
  const [form, setForm]               = useState({});
  const [comentario, setComentario]   = useState('');
  const [categorias, setCategorias]   = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await api.get(`/solicitudes/${id}`);
      setSolicitud(res.data);
      setComentarios(res.data.comentarios || []);
      setForm({
        titulo:       res.data.titulo,
        descripcion:  res.data.descripcion,
        prioridad:    res.data.prioridad,
        categoria_id: res.data.categoria_id || ''
      });
    } catch {
      navigate('/solicitudes');
    } finally {
      setCargando(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    cargar();
    api.get('/categorias').then(res => setCategorias(res.data.categorias));
  }, [cargar]);

  // HU-18: Guardar edición
  const guardarEdicion = async () => {
    try {
      await api.put(`/solicitudes/${id}`, form);
      setEditando(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  // HU-13: Agregar comentario
  const enviarComentario = async e => {
    e.preventDefault();
    if (!comentario.trim()) return;
    try {
      await api.post(`/solicitudes/${id}/comentarios`, { contenido: comentario });
      setComentario('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al comentar');
    }
  };

  // HU-05: Cambiar estado (administrador y responsable)
  const cambiarEstado = async (nuevoEstado) => {
    try {
      await api.patch(`/solicitudes/${id}/estado`, { estado: nuevoEstado });
      setError('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  // HU-14: Cerrar solicitud (administrador)
  const cerrar = async () => {
    if (!window.confirm('¿Cerrar esta solicitud? Esta acción no se puede deshacer.')) return;
    try {
      await api.patch(`/solicitudes/${id}/cerrar`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cerrar');
    }
  };

  if (cargando) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!solicitud) return null;

  const esAdmin       = usuario?.rol === 'administrador';
  const esResponsable = usuario?.rol === 'responsable';
  const esSolicitante = solicitud.solicitante_id === usuario?.id;
  const puedeEditar   = esSolicitante && solicitud.estado === 'pendiente';
  const puedeCambiarEstado = (esAdmin || esResponsable) && solicitud.estado !== 'cerrada';
  const puedeCerrar   = esAdmin && solicitud.estado !== 'cerrada';

  // Opciones de estado disponibles según estado actual
  const opcionesEstado = {
    pendiente:  [{ valor: 'en_proceso', label: '▶ Pasar a En Proceso', color: '#2980b9' }],
    en_proceso: [
      { valor: 'pendiente',  label: '↩ Volver a Pendiente',  color: '#f39c12' },
    ],
    cerrada: [],
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate('/solicitudes')} style={styles.backBtn}>← Volver</button>
          <div style={styles.headerActions}>
            {puedeEditar && !editando && (
              <button onClick={() => setEditando(true)} style={styles.editBtn}>Editar</button>
            )}
            {puedeCerrar && (
              <button onClick={cerrar} style={styles.closeBtn}>✓ Cerrar Solicitud</button>
            )}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Detalle */}
        <div style={styles.card}>
          <div style={styles.cardTop}>
            <code style={styles.idBadge}>{solicitud.id}</code>
            <span style={{ ...styles.estadoBadge, background: ESTADOS[solicitud.estado] }}>
              {LABELS[solicitud.estado]}
            </span>
          </div>

          {editando ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                style={styles.input}
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
              />
              <textarea
                style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <select style={styles.input} value={form.prioridad}
                  onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
                <select style={styles.input} value={form.categoria_id}
                  onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditando(false)} style={styles.cancelBtn}>Cancelar</button>
                <button onClick={guardarEdicion} style={styles.saveBtn}>Guardar cambios</button>
              </div>
            </div>
          ) : (
            <>
              <h2 style={styles.titulo}>{solicitud.titulo}</h2>
              <p style={styles.descripcion}>{solicitud.descripcion}</p>
              <div style={styles.meta}>
                <span><b>Solicitante:</b> {solicitud.solicitante_nombre}</span>
                <span><b>Categoría:</b> {solicitud.categoria_nombre || '—'}</span>
                <span><b>Prioridad:</b> {solicitud.prioridad}</span>
                <span><b>Creada:</b> {new Date(solicitud.created_at).toLocaleString('es-CO')}</span>
                {solicitud.closed_at && (
                  <span><b>Cerrada:</b> {new Date(solicitud.closed_at).toLocaleString('es-CO')}</span>
                )}
              </div>
            </>
          )}

          {/* ── Cambiar estado ── */}
          {puedeCambiarEstado && !editando && (
            <div style={styles.estadoSection}>
              <p style={styles.estadoLabel}>Cambiar estado:</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {opcionesEstado[solicitud.estado]?.map(op => (
                  <button
                    key={op.valor}
                    onClick={() => cambiarEstado(op.valor)}
                    style={{ ...styles.estadoBtn, background: op.color }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comentarios — HU-13 */}
        <div style={styles.card}>
          <h3 style={styles.seccion}>Comentarios ({comentarios.length})</h3>

          {comentarios.length === 0 && (
            <p style={{ color: '#999', fontSize: 14 }}>Aún no hay comentarios.</p>
          )}

          {comentarios.map(c => (
            <div key={c.id} style={styles.comentario}>
              <div style={styles.comentarioHeader}>
                <span style={styles.autorNombre}>{c.autor_nombre}</span>
                <span style={styles.comentarioFecha}>
                  {new Date(c.created_at).toLocaleString('es-CO')}
                </span>
              </div>
              <p style={styles.comentarioTexto}>{c.contenido}</p>
            </div>
          ))}

          {solicitud.estado !== 'cerrada' && (
            <form onSubmit={enviarComentario} style={styles.comentarioForm}>
              <textarea
                style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                placeholder="Escribe un comentario..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
              />
              <button type="submit" style={styles.saveBtn}>Agregar comentario</button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page:             { minHeight: '100vh', background: '#f0f4f8', padding: '32px 24px' },
  container:        { maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 },
  header:           { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn:          { background: 'none', border: 'none', color: '#1a3c6e', cursor: 'pointer', fontSize: 14, padding: 0 },
  headerActions:    { display: 'flex', gap: 10 },
  editBtn:          { padding: '8px 18px', background: '#fff', border: '1px solid #1a3c6e', color: '#1a3c6e', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  closeBtn:         { padding: '8px 18px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  error:            { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  card:             { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTop:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  idBadge:          { fontSize: 12, background: '#eef2ff', color: '#3730a3', padding: '4px 10px', borderRadius: 4 },
  estadoBadge:      { color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 12, fontWeight: 600 },
  titulo:           { margin: '0 0 12px', fontSize: 20, color: '#1a1a1a' },
  descripcion:      { margin: '0 0 20px', color: '#555', lineHeight: 1.6 },
  meta:             { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, color: '#666' },
  estadoSection:    { marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' },
  estadoLabel:      { margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#444' },
  estadoBtn:        { padding: '8px 18px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  seccion:          { margin: '0 0 16px', color: '#1a3c6e', fontSize: 16 },
  comentario:       { borderLeft: '3px solid #e0e7ff', paddingLeft: 16, marginBottom: 16 },
  comentarioHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  autorNombre:      { fontWeight: 600, fontSize: 14, color: '#333' },
  comentarioFecha:  { fontSize: 12, color: '#999' },
  comentarioTexto:  { margin: 0, fontSize: 14, color: '#555', lineHeight: 1.5 },
  comentarioForm:   { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  input:            { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  cancelBtn:        { padding: '9px 18px', background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  saveBtn:          { padding: '9px 20px', background: '#1a3c6e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, alignSelf: 'flex-end' },
};