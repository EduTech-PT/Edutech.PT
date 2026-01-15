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

// CONFIGURAÇÃO DINÂMICA (LocalStorage > Environment Variables > Placeholder)
// Permite que o administrador configure as chaves via UI sem redeploy imediato
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('edutech_sb_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('edutech_sb_key') : null;

// NOTA: Estas chaves devem vir de variáveis de ambiente em produção
const supabaseUrl = storedUrl || getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = storedKey || getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

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
  is_password_set BOOLEAN DEFAULT FALSE, -- Flag para controlar primeiro acesso
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

-- Tabela de Integrações do Sistema
CREATE TABLE IF NOT EXISTS public.system_integrations (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança Básicas
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Integrações (Apenas Admins)
DROP POLICY IF EXISTS "Admins manage integrations" ON public.system_integrations;
CREATE POLICY "Admins manage integrations" ON public.system_integrations 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_password_set)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN new.email = 'edutechpt@hotmail.com' THEN 'admin'::user_role 
      ELSE 'aluno'::user_role 
    END,
    FALSE -- Por defeito, a password não está definida (assume-se convite ou magic link inicial)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FUNÇÃO RPC: Verificar Estado do Utilizador (Login Flow)
-- Esta função permite ao frontend saber se o email existe e se tem password, sem expor dados.
CREATE OR REPLACE FUNCTION check_user_email(email_input TEXT)
RETURNS JSONB AS $$
DECLARE
  found_user public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO found_user FROM public.profiles WHERE email = email_input;
  
  IF found_user.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'exists', true, 
      'is_password_set', COALESCE(found_user.is_password_set, false)
    );
  ELSE
    RETURN jsonb_build_object('exists', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir acesso público a esta função (necessário para o ecrã de login)
GRANT EXECUTE ON FUNCTION check_user_email TO anon, authenticated, service_role;
`;