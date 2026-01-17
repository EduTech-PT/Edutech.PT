import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Interface de Resposta da RPC
interface UserStatus {
  exists: boolean;
  is_password_set?: boolean;
  is_invited?: boolean; // Novo campo
}

// Definição do Contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkUserStatus: (email: string) => Promise<UserStatus>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string, shouldCreateUser?: boolean) => Promise<void>;
  
  // Novos métodos divididos
  verifyFirstAccessCode: (email: string, otp: string) => Promise<void>;
  finalizeFirstAccess: (newPassword: string, fullName: string) => Promise<void>;
  
  completeFirstAccess: (email: string, otp: string, newPassword: string, fullName?: string) => Promise<void>; // Deprecado, mas mantido para compatibilidade
  
  // MODO DE RESGATE (Novo)
  enterRescueMode: () => void;
  
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para processar dados do utilizador
  const handleUserSession = async (authUser: any) => {
    try {
      // FAILSAFE: Proteção contra downgrade de Admin
      const isSuperAdmin = authUser.email?.toLowerCase() === 'edutechpt@hotmail.com';
      
      // Metadados da Auth (Backup imediato caso a DB falhe)
      const metadata = authUser.user_metadata || {};

      // Timeout de segurança aumentado para evitar falsos negativos
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout' }), 6000));
      
      const response: any = await Promise.race([profilePromise, timeoutPromise]);
      const { data: profile, error } = response;

      if (profile && !error) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: profile.full_name || metadata.full_name || metadata.name,
          student_number: profile.student_number, // Mapeamento do novo ID visível
          // Se for o super admin, força 'admin', senão usa a role do perfil ou fallback para 'aluno'
          role: isSuperAdmin ? 'admin' : ((profile.role as UserRole) || 'aluno'),
          avatar_url: profile.avatar_url || metadata.avatar_url || metadata.picture,
          is_password_set: profile.is_password_set, // Importante para redirecionamento
          created_at: authUser.created_at,
        });
      } else {
         // --- STRICT MODE ATIVADO ---
         // Se o perfil não existe na BD (foi eliminado) e NÃO é o Super Admin, revogar acesso.
         
         if (isSuperAdmin) {
             console.warn("CRÍTICO: Perfil Admin não encontrado. Ativando modo de reparação.");
             // Força a criação de um utilizador em memória para permitir acesso ao Dashboard e execução do SQL
             setUser({
                id: authUser.id,
                email: authUser.email!,
                full_name: metadata.full_name || 'Admin (Modo de Reparação)',
                role: 'admin',
                student_number: 10000,
                is_password_set: true, // Assume true para não ficar preso no login
                avatar_url: metadata.avatar_url,
                created_at: authUser.created_at,
            });
         } else {
             console.warn("Utilizador autenticado mas sem perfil (Provavelmente eliminado). Forçando Logout.");
             await supabase.auth.signOut();
             setUser(null);
         }
      }
    } catch (err) {
      console.error('Erro crítico ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  // MODO DE RESGATE: Permite entrar sem autenticação do Supabase em caso de emergência
  const enterRescueMode = () => {
    console.warn("ATIVANDO MODO DE RESGATE");
    setUser({
        id: 'rescue-admin-id',
        email: 'edutechpt@hotmail.com',
        full_name: 'Admin (Modo Resgate)',
        role: 'admin',
        student_number: 10000,
        is_password_set: true,
        created_at: new Date().toISOString()
    });
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    // 1. Verificação Inicial Explícita
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (mounted) await handleUserSession(session.user);
        } else {
          if (mounted) setLoading(false);
        }
      } catch (err) {
        console.error("Erro na inicialização da Auth:", err);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 2. Listener de Eventos em Tempo Real
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Se for apenas uma atualização de token, não bloqueamos a UI
      if (event === 'TOKEN_REFRESHED') {
         return; 
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        if (session?.user) {
           await handleUserSession(session.user);
        } else {
           setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    // 3. SAFETY TIMEOUT GLOBAL
    const safetyTimer = setTimeout(() => {
        if (mounted && loading) {
            console.warn("⚠️ Auth Safety Timeout Triggered");
            setLoading(false);
        }
    }, 8000);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const checkUserStatus = async (email: string): Promise<UserStatus> => {
    try {
        // Se a config do Supabase estiver inválida, simula sucesso para admins locais
        if (!isSupabaseConfigured && email.includes('admin')) {
             return { exists: true, is_password_set: true };
        }

        const { data, error } = await supabase.rpc('check_user_status_extended', { email_input: email });
        
        if (error) {
            console.error("RPC Error:", error);
            // Fallback para query direta se a RPC falhar
            const { data: profile } = await supabase.from('profiles').select('id, is_password_set').eq('email', email).single();
            if (profile) return { exists: true, is_password_set: profile.is_password_set };
            return { exists: false, is_invited: false };
        }

        return data as UserStatus;
    } catch (err) {
        console.error("Auth Check Error:", err);
        return { exists: false };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    // Bypass Local
    if (!isSupabaseConfigured && email === 'admin@edutech.pt' && password === 'admin') {
        enterRescueMode();
        return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithOtp = async (email: string, shouldCreateUser = false) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: shouldCreateUser, // TRUE apenas se for novo user
        // Se estivermos em localhost, o emailRedirectTo pode ser ignorado pelo Supabase em favor do Site URL
        emailRedirectTo: window.location.origin, 
      },
    });
    if (error) throw error;
  };

  // Passo 1: Verificar Código (Login sem Password ou Registo)
  const verifyFirstAccessCode = async (email: string, otp: string) => {
      const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email' // Magic Link / OTP type
      });
      
      if (error) throw error;
      if (data.user) {
         // Atualiza o estado local imediatamente
         await handleUserSession(data.user);
      }
  };

  // Passo 2: Definir Password e Nome (Finalizar Registo)
  const finalizeFirstAccess = async (newPassword: string, fullName: string) => {
      // 1. Atualizar Password na Auth
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      // 2. Atualizar Perfil e Marcar como Configurado
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
            full_name: fullName,
            is_password_set: true
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) throw profileError;

      // Atualizar estado local para forçar redirecionamento
      setUser(prev => prev ? ({ ...prev, full_name: fullName, is_password_set: true }) : null);
  };
  
  // Função Legada (Compatibilidade)
  const completeFirstAccess = async (email: string, otp: string, newPassword: string, fullName?: string) => {
      // Se otp for 'RECOVERY_MODE', é apenas update de password de alguém já logado
      if (otp === 'RECOVERY_MODE') {
         const { error } = await supabase.auth.updateUser({ password: newPassword });
         if (error) throw error;
         return;
      }
      
      await verifyFirstAccessCode(email, otp);
      if (fullName) {
          await finalizeFirstAccess(newPassword, fullName);
      }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        checkUserStatus, 
        signInWithPassword, 
        signInWithOtp, 
        verifyFirstAccessCode,
        finalizeFirstAccess,
        completeFirstAccess,
        enterRescueMode,
        signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};