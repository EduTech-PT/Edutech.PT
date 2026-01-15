import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Interface de Resposta da RPC
interface UserStatus {
  exists: boolean;
  is_password_set?: boolean;
}

// Definição do Contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkUserStatus: (email: string) => Promise<UserStatus>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  completeFirstAccess: (email: string, otp: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para processar dados do utilizador
  const handleUserSession = async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && !error) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: profile.full_name,
          role: (profile.role as UserRole) || 'aluno',
          avatar_url: profile.avatar_url,
          created_at: authUser.created_at,
        });
      } else {
         // Fallback total se não conseguir ler o perfil
         setUser({
          id: authUser.id,
          email: authUser.email!,
          role: 'aluno',
          created_at: authUser.created_at,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      // Importante: Garantir que o loading termina sempre
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Verificação Inicial Explícita (Previne loading infinito se o listener falhar)
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
      console.log("Auth Event:", event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
           await handleUserSession(session.user);
        } else {
           setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else {
        // Outros eventos (PASSWORD_RECOVERY, USER_UPDATED, etc)
        // Apenas garantimos que o loading não fica preso
        if (!user && !session?.user) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 1. Verificar se o email existe e se tem password (RPC)
  const checkUserStatus = async (email: string): Promise<UserStatus> => {
    if (!isSupabaseConfigured) {
      // Mock para modo local
      if (email === 'edutechpt@hotmail.com') return { exists: true, is_password_set: true };
      return { exists: false };
    }

    try {
      const { data, error } = await supabase.rpc('check_user_email', { email_input: email });
      if (error) throw error;
      return data as UserStatus;
    } catch (e) {
      console.error("Erro ao verificar email:", e);
      throw e; 
    }
  };

  // 2. Login com Password
  const signInWithPassword = async (email: string, password: string) => {
    // Não activamos setLoading(true) global aqui para evitar conflito com o estado local do Login
    // Apenas aguardamos a promessa
    try {
      if (!isSupabaseConfigured && email === 'edutechpt@hotmail.com') {
         // Bypass local
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
      // O listener onAuthStateChange lidará com a atualização do estado do utilizador
    } catch (error) {
       throw error;
    }
  };

  // 3. Enviar OTP
  const signInWithOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
          email,
      });
      if (error) throw error;
    } catch (error) {
       throw error;
    }
  };

  // 4. Completar Primeiro Acesso / Recuperação
  const completeFirstAccess = async (email: string, otp: string, newPassword: string) => {
    try {
      let userId = user?.id;

      // Se não estivermos já logados via Magic Link (otp != 'RECOVERY_MODE')
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
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_password_set: true })
          .eq('id', userId);
        
        if (profileError) console.error("Aviso: Falha ao atualizar flag de password", profileError);
        
        // Forçar refresh da sessão para garantir que o user state está atualizado
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