import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ correo: '', password: '' });
  const [error, setError]   = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(form.correo, form.password);
      navigate('/solicitudes');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Sistema de Gestión de Solicitudes</h1>
          <p style={styles.subtitle}>Universidad Nacional de Colombia</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo institucional</label>
            <input
              type="email"
              style={styles.input}
              placeholder="correo@unal.edu.co"
              value={form.correo}
              onChange={e => setForm({ ...form, correo: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.btn} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Usuarios de prueba:</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>admin@unal.edu.co · anietoo@unal.edu.co</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>Contraseña: Password123!</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card:     { background: '#fff', borderRadius: 12, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
  header:   { textAlign: 'center', marginBottom: 28 },
  title:    { fontSize: 20, fontWeight: 700, color: '#1a3c6e', margin: '0 0 6px' },
  subtitle: { fontSize: 14, color: '#666', margin: 0 },
  form:     { display: 'flex', flexDirection: 'column', gap: 16 },
  field:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:    { fontSize: 14, fontWeight: 500, color: '#333' },
  input:    { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  error:    { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  btn:      { padding: '12px', background: '#1a3c6e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  hint:     { marginTop: 24, padding: '12px', background: '#f8f9fa', borderRadius: 8 },
};
