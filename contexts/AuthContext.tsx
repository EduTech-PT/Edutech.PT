import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Interface de Resposta da RPC
interface UserStatus {
  exists: boolean;
  is_password_set?: boolean;
  is_invited?: boolean;
}

// Definição do Contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkUserStatus: (email: string) => Promise<UserStatus>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string, shouldCreateUser?: boolean) => Promise<void>;
  
  verifyFirstAccessCode: (email: string, otp: string) => Promise<void>;
  finalizeFirstAccess: (newPassword: string, fullName: string) => Promise<void>;
  completeFirstAccess: (email: string, otp: string, newPassword: string, fullName?: string) => Promise<void>; // Deprecado, mas mantido para compatibilidade
  
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
          student_number: profile.student_number,
          role: isSuperAdmin ? 'admin' : ((profile.role as UserRole) || 'aluno'),
          avatar_url: profile.avatar_url || metadata.avatar_url || metadata.picture,
          is_password_set: profile.is_password_set,
          created_at: authUser.created_at,
        });
      } else {
         // --- STRICT MODE ---
         // Se o perfil não existe na BD e é Super Admin, tenta criar ou avisar
         if (isSuperAdmin) {
             console.warn("CRÍTICO: Perfil Admin não encontrado na tabela profiles.");
             // Mesmo sem perfil na tabela, deixamos o Auth object fluir para permitir reparação via SQL depois
             setUser({
                id: authUser.id,
                email: authUser.email!,
                full_name: metadata.full_name || 'Admin (Sem Perfil)',
                role: 'admin',
                student_number: 10000,
                is_password_set: true,
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
      if (event === 'TOKEN_REFRESHED') return;

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
        const { data, error } = await supabase.rpc('check_user_status_extended', { email_input: email });
        
        if (error) {
            console.error("RPC Error (Fallback Triggered):", error);
            
            // FALLBACK ROBUSTO:
            const { data: profile } = await supabase.from('profiles').select('id, is_password_set').eq('email', email).single();
            if (profile) return { exists: true, is_password_set: profile.is_password_set };

            const { data: invite } = await supabase.from('user_invites').select('email').eq('email', email).single();
            if (invite) return { exists: false, is_invited: true };

            return { exists: false, is_invited: false };
        }

        return data as UserStatus;
    } catch (err) {
        console.error("Auth Check Error:", err);
        return { exists: false };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithOtp = async (email: string, shouldCreateUser = false) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: shouldCreateUser,
        emailRedirectTo: window.location.origin, 
      },
    });
    if (error) throw error;
  };

  const verifyFirstAccessCode = async (email: string, otp: string) => {
      const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email'
      });
      
      if (error) throw error;
      if (data.user) {
         await handleUserSession(data.user);
      }
  };

  const finalizeFirstAccess = async (newPassword: string, fullName: string) => {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
            full_name: fullName,
            is_password_set: true
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) throw profileError;

      setUser(prev => prev ? ({ ...prev, full_name: fullName, is_password_set: true }) : null);
  };
  
  const completeFirstAccess = async (email: string, otp: string, newPassword: string, fullName?: string) => {
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