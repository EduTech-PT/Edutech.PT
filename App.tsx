import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// Componente para processar Hashes do Supabase que conflituam com o HashRouter
// Ex: #error=access_denied... que o HashRouter tenta interpretar como rota
const SupabaseHashHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // O HashRouter coloca o fragmento da rota em location.pathname
    // Se o Supabase redirecionar para /#error=..., o HashRouter vê "/error=..." como pathname
    const path = location.pathname;

    if (path.includes('error=')) {
      // Extrair parâmetros de erro da "rota"
      // Remove a barra inicial se existir
      const queryStr = path.startsWith('/') ? path.substring(1) : path;
      const params = new URLSearchParams(queryStr);
      
      const errorDesc = params.get('error_description');
      const errorCode = params.get('error_code');

      // Redirecionar para o Login com o erro no state
      navigate('/login', { 
        replace: true, 
        state: { 
          error: errorDesc,
          code: errorCode
        } 
      });
    }
  }, [location, navigate]);

  return null;
};

// Componente para rotas protegidas
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <SupabaseHashHandler />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard/*" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          {/* Catch-all para redirecionar URLs inválidas (incluindo fragmentos de hash do Supabase não tratados) para Login/Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;