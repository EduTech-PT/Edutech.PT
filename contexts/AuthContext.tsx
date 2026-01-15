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

  useEffect(() => {
    // Escuta alterações na autenticação do Supabase em tempo real
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: profile.full_name,
              // Fallback de segurança: se role for undefined, assume 'aluno'
              role: (profile.role as UserRole) || 'aluno',
              avatar_url: profile.avatar_url,
              created_at: session.user.created_at,
            });
          } else {
             // Fallback total se não conseguir ler o perfil
             setUser({
              id: session.user.id,
              email: session.user.email!,
              role: 'aluno',
              created_at: session.user.created_at,
            });
          }
        } catch (err) {
          console.error('Unexpected auth error:', err);
        }
      } else {
         if (!user) setUser(null);
      }
      setLoading(false);
    });

    return () => {
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
      throw e; // Repassa erro para UI
    }
  };

  // 2. Login com Password (Utilizadores Recorrentes)
  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // 3. Enviar OTP (Parte 1 do Primeiro Acesso)
  const signInWithOtp = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  // 4. Completar Primeiro Acesso (Verificar OTP + Definir Password)
  const completeFirstAccess = async (email: string, otp: string, newPassword: string) => {
    setLoading(true);
    try {
      // A. Verificar OTP e Logar
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      if (otpError) throw otpError;

      if (data.user) {
        // B. Atualizar Password no Auth
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        // C. Atualizar flag no Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_password_set: true })
          .eq('id', data.user.id);
        
        if (profileError) console.error("Aviso: Falha ao atualizar flag de password", profileError);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setLoading(false);
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