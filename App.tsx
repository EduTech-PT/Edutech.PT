import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { supabase } from './services/supabase';

// Componente para processar Hashes do Supabase (Magic Links, Recovery, Errors)
// Resolve conflitos entre o HashRouter e os fragmentos de URL do Supabase
const SupabaseHashHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se existe um hash na URL (ex: #access_token=... ou #error=...)
    // Nota: Com HashRouter, o location.pathname pode conter o que seria o hash
    const hash = window.location.hash;
    const path = location.pathname;

    // 1. Tratamento de Erros (ex: Link expirado)
    if (path.includes('error=') || hash.includes('error=')) {
      const queryStr = path.startsWith('/') ? path.substring(1) : path;
      const params = new URLSearchParams(queryStr);
      const errorDesc = params.get('error_description');
      const errorCode = params.get('error_code');

      navigate('/login', { 
        replace: true, 
        state: { error: errorDesc, code: errorCode } 
      });
      return;
    }

    // 2. Tratamento de Magic Link / Recovery (Tokens na URL)
    // Se detetarmos tokens, deixamos o Supabase processar (AuthContext)
    // e redirecionamos para limpar a URL feia.
    if (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=magiclink') || path.includes('access_token')) {
       // O AuthProvider (via onAuthStateChange) vai apanhar a sessão automaticamente.
       // Apenas garantimos que o utilizador vai para o sítio certo.
       console.log("Token de autenticação detetado. Processando...");
       
       // Pequeno delay para garantir que o onAuthStateChange dispara primeiro
       setTimeout(() => {
         if (hash.includes('type=recovery')) {
            // Se for recuperação de password, forçar ida para o Login (passo de reset)
            // O AuthContext deve lidar com a sessão ativa
            navigate('/login', { replace: true, state: { recoveryMode: true } });
         } else {
            navigate('/dashboard', { replace: true });
         }
       }, 500);
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 text-sm font-medium">A carregar a sua conta...</p>
        </div>
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
          {/* Catch-all inteligente: Se não for uma rota válida, manda para Login se não estiver autenticado */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;