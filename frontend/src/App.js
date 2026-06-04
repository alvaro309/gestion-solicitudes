import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login           from './pages/Login';
import Solicitudes     from './pages/Solicitudes';
import NuevaSolicitud  from './pages/NuevaSolicitud';
import DetalleSolicitud from './pages/DetalleSolicitud';

const PrivateRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  return usuario ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return usuario ? <Navigate to="/solicitudes" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/solicitudes" element={<PrivateRoute><Solicitudes /></PrivateRoute>} />
          <Route path="/solicitudes/nueva" element={<PrivateRoute><NuevaSolicitud /></PrivateRoute>} />
          <Route path="/solicitudes/:id" element={<PrivateRoute><DetalleSolicitud /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/solicitudes" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
