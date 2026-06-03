import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'media', categoria_id: '' });
  const [error, setError]     = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get('/categorias').then(res => setCategorias(res.data.categorias));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const res = await api.post('/solicitudes', form);
      navigate(`/solicitudes/${res.data.solicitud.id}`, { state: { nueva: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <button onClick={() => navigate('/solicitudes')} style={styles.backBtn}>← Volver</button>
          <h2 style={styles.h2}>Nueva Solicitud</h2>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Título *</label>
            <input
              style={styles.input}
              placeholder="Describe brevemente tu solicitud"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              required maxLength={120}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descripción *</label>
            <textarea
              style={{ ...styles.input, minHeight: 120, resize: 'vertical' }}
              placeholder="Detalla tu solicitud con toda la información necesaria"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              required
            />
          </div>

          <div style={styles.row}>
            {/* HU-20: selección de categoría */}
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Categoría</label>
              <select
                style={styles.input}
                value={form.categoria_id}
                onChange={e => setForm({ ...form, categoria_id: e.target.value })}
              >
                <option value="">Sin categoría</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Prioridad</label>
              <select
                style={styles.input}
                value={form.prioridad}
                onChange={e => setForm({ ...form, prioridad: e.target.value })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate('/solicitudes')} style={styles.cancelBtn}>
              Cancelar
            </button>
            <button type="submit" style={styles.submitBtn} disabled={enviando}>
              {enviando ? 'Registrando...' : 'Registrar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page:       { minHeight: '100vh', background: '#f0f4f8', display: 'flex', justifyContent: 'center', padding: '40px 24px' },
  card:       { background: '#fff', borderRadius: 12, padding: 36, width: '100%', maxWidth: 640, height: 'fit-content', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' },
  cardHeader: { marginBottom: 28 },
  backBtn:    { background: 'none', border: 'none', color: '#1a3c6e', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 12 },
  h2:         { margin: 0, color: '#1a3c6e', fontSize: 22 },
  form:       { display: 'flex', flexDirection: 'column', gap: 20 },
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  row:        { display: 'flex', gap: 16 },
  label:      { fontSize: 14, fontWeight: 500, color: '#333' },
  input:      { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' },
  error:      { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  actions:    { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn:  { padding: '10px 20px', background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  submitBtn:  { padding: '10px 24px', background: '#1a3c6e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};
