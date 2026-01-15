import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Definição do Contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
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
          // Busca os dados do perfil enriquecidos (role, full_name)
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Erro ao buscar perfil:', error);
            // Fallback se o perfil ainda não foi criado pelo trigger
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: 'aluno', // Default seguro
              created_at: session.user.created_at,
            });
          } else if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: profile.full_name,
              role: profile.role as UserRole,
              avatar_url: profile.avatar_url,
              created_at: session.user.created_at,
            });
          }
        } catch (err) {
          console.error('Unexpected auth error:', err);
          setUser(null);
        }
      } else {
        // Se não houver sessão e não estivermos em bypass manual (que não persiste no refresh)
        if (!user) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    setLoading(true);
    try {
      // MODO DE SEGURANÇA / CONFIGURAÇÃO INICIAL
      // Se as chaves do Supabase não estiverem configuradas (estão em placeholder),
      // permitimos a entrada APENAS do email de administrador solicitado para validação do layout.
      if (!isSupabaseConfigured) {
        if (email === 'edutechpt@hotmail.com') {
          // Bypass temporário para permitir visualização do dashboard
          const mockAdmin: User = {
            id: 'admin-local-bypass',
            email: 'edutechpt@hotmail.com',
            full_name: 'Admin EduTech (Modo Local)',
            role: 'admin',
            created_at: new Date().toISOString()
          };
          setUser(mockAdmin);
          return; // Retorna sucesso imediato sem chamar Supabase
        } else {
          throw new Error('Supabase não configurado. Contacte o administrador para configurar as chaves de API.');
        }
      }

      // Autenticação Real via Magic Link (OTP)
      // O utilizador receberá um email para entrar.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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