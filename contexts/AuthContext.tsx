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
  completeFirstAccess: (email: string, otp: string, newPassword: string, fullName?: string) => Promise<void>;
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
          // Se for o super admin, força 'admin', senão usa a role do perfil ou fallback para 'aluno'
          role: isSuperAdmin ? 'admin' : ((profile.role as UserRole) || 'aluno'),
          avatar_url: profile.avatar_url || metadata.avatar_url || metadata.picture,
          created_at: authUser.created_at,
        });
      } else {
         // Fallback Inteligente para evitar "Perfil Sem Nome"
         console.warn("Perfil Supabase não carregado (Timeout/Erro), usando cache ou metadados.", error);
         
         setUser(currentUser => {
            // 1. Se já existe dados para este utilizador, preserva-os (evita o "salto" visual)
            if (currentUser && currentUser.id === authUser.id) {
                return {
                    ...currentUser,
                    // Garante apenas que permissões críticas não são perdidas
                    role: isSuperAdmin ? 'admin' : currentUser.role
                };
            }

            // 2. Se é um login novo e a DB falhou, usa os metadados do Auth
            return {
                id: authUser.id,
                email: authUser.email!,
                full_name: metadata.full_name || metadata.name || 'Utilizador',
                role: isSuperAdmin ? 'admin' : 'aluno',
                avatar_url: metadata.avatar_url || metadata.picture,
                created_at: authUser.created_at,
            };
         });
      }
    } catch (err) {
      console.error('Erro crítico ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
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
            console.warn("⚠️ Auth Safety Timeout: Forçando desbloqueio da UI.");
            setLoading(false);
        }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 1. Verificar se o email existe (Com Timeout de 5s)
  const checkUserStatus = async (email: string): Promise<UserStatus> => {
    if (!isSupabaseConfigured) {
      if (email === 'edutechpt@hotmail.com') return { exists: true, is_password_set: true };
      return { exists: false };
    }

    try {
      // Usar a nova função EXTENDED que verifica convites
      const rpcPromise = supabase.rpc('check_user_status_extended', { email_input: email });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('A verificação demorou demasiado tempo. Verifique a sua internet.')), 5000)
      );

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (error) {
         // Fallback se a função extended não existir ainda (para não quebrar sites com SQL antigo)
         console.warn("RPC Extended falhou, tentando versão simples", error);
         const { data: simpleData, error: simpleError } = await supabase.rpc('check_user_email', { email_input: email });
         if (simpleError) throw error;
         return simpleData as UserStatus;
      }
      
      return data as UserStatus;
    } catch (e) {
      console.error("Erro ao verificar email:", e);
      throw e; 
    }
  };

  // 2. Login com Password
  const signInWithPassword = async (email: string, password: string) => {
    try {
      if (!isSupabaseConfigured && email === 'edutechpt@hotmail.com') {
         setUser({
            id: 'admin-local-bypass',
            email: 'edutechpt@hotmail.com',
            full_name: 'Admin EduTech (Modo Local)',
            role: 'admin',
            created_at: new Date().toISOString()
          });
         return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
       throw error;
    }
  };

  // 3. Enviar OTP (Login sem Password ou Criação de Conta via Convite)
  const signInWithOtp = async (email: string, shouldCreateUser: boolean = false) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: {
            shouldCreateUser: shouldCreateUser // TRUE se for convite, FALSE se for login normal
          }
      });
      if (error) throw error;
    } catch (error) {
       throw error;
    }
  };

  // 4. Completar Primeiro Acesso / Recuperação
  const completeFirstAccess = async (email: string, otp: string, newPassword: string, fullName?: string) => {
    try {
      let userId = user?.id;

      if (otp !== 'RECOVERY_MODE') {
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email'
          });
          if (otpError) throw otpError;
          userId = data.user?.id;
      }

      if (userId) {
        // 1. Atualizar Password na Auth
        const { error: updateError } = await supabase.auth.updateUser({ 
            password: newPassword,
            data: { is_password_set: true } // Guarda flag nos metadados também
        });
        if (updateError) throw updateError;

        // 2. Atualizar Perfil na Base de Dados (Nome e Flag)
        const updateData: any = { is_password_set: true };
        if (fullName) {
            updateData.full_name = fullName;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        
        if (profileError) console.error("Erro ao atualizar nome no perfil:", profileError);

        // Forçar refresh da sessão para atualizar estado no contexto
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await handleUserSession(session.user);
      }
    } catch (error) {
       throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, checkUserStatus, signInWithPassword, signInWithOtp, completeFirstAccess, signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};