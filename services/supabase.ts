import { createClient } from '@supabase/supabase-js';

// Função segura para aceder a variáveis de ambiente sem causar crash no browser se 'process' não existir
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    // Se process não estiver definido (browser sem polyfill), retorna undefined ou tenta import.meta
    try {
      // @ts-ignore - suporte para Vite
      return import.meta.env[key];
    } catch (e2) {
      return undefined;
    }
  }
};

// NOTA: Estas chaves devem vir de variáveis de ambiente em produção
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

// Flag para verificar se o Supabase está devidamente configurado
export const isSupabaseConfigured = !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * INSTRUÇÕES SQL PARA SUPABASE (DATABASE-FIRST)
 * Execute este script no SQL Editor do Supabase para criar a estrutura necessária.
 */
export const REQUIRED_SQL_SCHEMA = `
-- Criar tipos de Enum para Roles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'formador', 'aluno');

-- Tabela de Perfis Públicos (Extensão da auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'aluno',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  cover_image TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar profile automaticamente ao criar user no Auth
-- Lógica atualizada para conceder ADMIN ao email edutechpt@hotmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN new.email = 'edutechpt@hotmail.com' THEN 'admin'::user_role 
      ELSE 'aluno'::user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;