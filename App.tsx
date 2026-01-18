import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Loader2 } from 'lucide-react';

// Componente para processar Hashes do Supabase (Magic Links, Recovery, Errors, OAuth)
// Interceta o retorno do Google antes que o Router mostre a página errada
const SupabaseHashHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Verificar se existe um hash na URL (ex: #access_token=... ou #error=...)
    const hash = window.location.hash;
    const path = location.pathname;

    // 1. Tratamento de Erros (ex: Link expirado ou cancelado)
    if (path.includes('error=') || hash.includes('error=')) {
      const queryStr = path.startsWith('/') ? path.substring(1) : path;
      const params = new URLSearchParams(queryStr);
      const errorDesc = params.get('error_description');
      const errorCode = params.get('error_code');

      setIsProcessing(false);
      navigate('/login', { 
        replace: true, 
        state: { error: errorDesc, code: errorCode } 
      });
      return;
    }

    // 2. Tratamento de Tokens de Autenticação (OAuth Google, Magic Link, Recovery)
    // Se detetarmos access_token no hash, ativamos o modo de "Processamento"
    // Isto bloqueia a UI de mostrar o Login enquanto o Supabase extrai a sessão.
    if (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=magiclink')) {
       console.log("Token de autenticação detetado. A processar...");
       setIsProcessing(true);
       
       // Damos tempo ao Supabase Client para consumir o hash e atualizar a sessão
       const checkSession = async () => {
           // Pequeno delay para garantir que o cliente Supabase processou o hash internamente
           await new Promise(resolve => setTimeout(resolve, 500));
           const { data } = await supabase.auth.getSession();
           
           if (data.session) {
               console.log("Sessão confirmada. Redirecionando...");
               // Sessão válida encontrada! Limpar UI e Redirecionar.
               setIsProcessing(false);
               
               if (hash.includes('type=recovery')) {
                   navigate('/login', { replace: true, state: { recoveryMode: true } });
               } else {
                   navigate('/dashboard', { replace: true });
               }
           } else {
               // Se após tentativas não houver sessão, algo falhou. Libertar UI.
               console.warn("Sessão não encontrada após processamento do hash.");
               setTimeout(() => setIsProcessing(false), 2000);
           }
       };

       checkSession();
    }
  }, [location, navigate]);

  if (isProcessing) {
      return (
         <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[9999] flex items-center justify-center">
             <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                 <div className="relative">
                     <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white"></div>
                     </div>
                 </div>
                 <div className="text-center">
                     <h3 className="text-lg font-bold text-slate-800">A iniciar sessão...</h3>
                     <p className="text-sm text-slate-500">A verificar credenciais Google</p>
                 </div>
             </div>
         </div>
      );
  }

  return null;
};

// Componente para atualizar Favicon e Título dinamicamente com base na BD
const BrandingHandler = () => {
    useEffect(() => {
        if (isSupabaseConfigured) {
            supabase.from('system_integrations').select('value').eq('key', 'site_branding').single()
                .then(({ data }) => {
                    if (data?.value) {
                        const { faviconUrl, siteName } = data.value;
                        
                        // Atualizar Favicon
                        if (faviconUrl) {
                            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                            if (!link) {
                                link = document.createElement('link');
                                link.rel = 'icon';
                                document.getElementsByTagName('head')[0].appendChild(link);
                            }
                            link.href = faviconUrl;
                        }

                        // Atualizar Título da Página (Aba do Navegador)
                        if (siteName) {
                            document.title = siteName;
                        }
                    }
                });
        }
    }, []);
    return null;
};

// Componente para rotas protegidas
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
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
      <BrandingHandler />
      <Router>
        {/* O Handler agora pode bloquear a vista se estiver a processar OAuth */}
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