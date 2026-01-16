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

// CONFIGURAÇÃO DINÂMICA (LocalStorage > Environment Variables > Hardcoded Values)
// Permite que o administrador configure as chaves via UI sem redeploy imediato
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('edutech_sb_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('edutech_sb_key') : null;

// CREDENCIAIS FORNECIDAS
// URL: https://xvqxtgcewqfyxjbsntva.supabase.co
// Key: sb_publishable_vi-77ZFF8d0CjCsXLosdqg_QMj9AA1h
const supabaseUrl = storedUrl || getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://xvqxtgcewqfyxjbsntva.supabase.co';
const supabaseAnonKey = storedKey || getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_vi-77ZFF8d0CjCsXLosdqg_QMj9AA1h';

// Flag para verificar se o Supabase está devidamente configurado
export const isSupabaseConfigured = !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder');

// Cast to any to prevent TypeScript errors about missing properties on SupabaseAuthClient
export const supabase = createClient(supabaseUrl, supabaseAnonKey) as any;

// VERSÃO ATUAL DO SQL (Deve coincidir com a versão do site)
export const CURRENT_SQL_VERSION = 'v1.2.19';

/**
 * INSTRUÇÕES SQL PARA SUPABASE (DATABASE-FIRST)
 * Execute este script no SQL Editor do Supabase para corrigir e criar a estrutura necessária.
 */
export const REQUIRED_SQL_SCHEMA = `
-- 1. EXTENSÕES & SETUP GERAL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÕES AUXILIARES DE SEGURANÇA (Otimizadas com STABLE e (select auth.uid()))
-- Verifica se é admin de forma segura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  );
END;
$$;

-- Verifica se tem privilégios (Admin ou Formador)
CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND (role = 'admin' OR role = 'formador')
  );
END;
$$;

-- 3. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'formador', 'aluno');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. TABELAS (Garantir existência)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'aluno',
  is_password_set BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Correção de FK
DO $$ BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  cover_image TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.system_integrations (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 5. SEGURANÇA RLS & LIMPEZA
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_integrations ENABLE ROW LEVEL SECURITY;

-- === LIMPEZA DE POLÍTICAS (REFORÇADA) ===
-- Removemos explicitamente TODAS as variações possíveis para evitar erro 42710
DROP POLICY IF EXISTS "Public Access Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users manage own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Perfis visíveis publicamente" ON public.profiles;
DROP POLICY IF EXISTS "Gestão de Perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins apagam perfis" ON public.profiles;

DROP POLICY IF EXISTS "Ver cursos" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged)" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) INSERT" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) UPDATE" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) DELETE" ON public.courses;

DROP POLICY IF EXISTS "Ver matriculas" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin)" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) INSERT" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) UPDATE" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) DELETE" ON public.enrollments;

DROP POLICY IF EXISTS "Ver integrações" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações INSERT" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações UPDATE" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações DELETE" ON public.system_integrations;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users manage own skills" ON public.user_skills;
    DROP POLICY IF EXISTS "Users manage own certs" ON public.user_certifications;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;


-- === NOVAS POLÍTICAS OTIMIZADAS ===

-- PROFILES
CREATE POLICY "Perfis visíveis publicamente" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Gestão de Perfis" ON public.profiles FOR UPDATE 
USING ( (select auth.uid()) = id OR public.is_admin() );
CREATE POLICY "Admins apagam perfis" ON public.profiles FOR DELETE
USING (public.is_admin());

-- COURSES
CREATE POLICY "Ver cursos" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Gerir cursos (Privileged) INSERT" ON public.courses FOR INSERT
WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) UPDATE" ON public.courses FOR UPDATE
USING (public.is_privileged()) WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) DELETE" ON public.courses FOR DELETE
USING (public.is_privileged());

-- ENROLLMENTS
CREATE POLICY "Ver matriculas" ON public.enrollments FOR SELECT
USING (public.is_privileged() OR user_id = (select auth.uid()));
CREATE POLICY "Gerir matriculas (Admin) INSERT" ON public.enrollments FOR INSERT
WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) UPDATE" ON public.enrollments FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) DELETE" ON public.enrollments FOR DELETE
USING (public.is_admin());

-- SYSTEM INTEGRATIONS
-- Permite leitura da versão do SQL para admins e chaves públicas
CREATE POLICY "Ver integrações" ON public.system_integrations FOR SELECT
USING (public.is_admin() OR key IN ('landing_page_content', 'resize_pixel_instructions', 'sql_version'));
CREATE POLICY "Admins gerem integrações INSERT" ON public.system_integrations FOR INSERT
WITH CHECK (public.is_admin());
CREATE POLICY "Admins gerem integrações UPDATE" ON public.system_integrations FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins gerem integrações DELETE" ON public.system_integrations FOR DELETE
USING (public.is_admin());


-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
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
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; 
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. RPC - GESTÃO DE UTILIZADORES
CREATE OR REPLACE FUNCTION check_user_email(email_input TEXT)
RETURNS JSONB 
SECURITY DEFINER SET search_path = public
AS $$
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
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_user_email TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION bulk_update_roles(user_ids UUID[], new_role user_role)
RETURNS VOID 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem realizar esta ação.';
  END IF;

  UPDATE public.profiles 
  SET role = new_role 
  WHERE id = ANY(user_ids)
  AND id != (select auth.uid()); 
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION bulk_delete_users(user_ids UUID[])
RETURNS VOID 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem realizar esta ação.';
  END IF;

  DELETE FROM public.profiles 
  WHERE id = ANY(user_ids)
  AND id != (select auth.uid()); 
END;
$$ LANGUAGE plpgsql;

-- Função para reparar contas (Sincronizar Auth -> Public)
-- Agora copia explicitamente o email e garante a criação
CREATE OR REPLACE FUNCTION sync_profiles()
RETURNS VOID 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  -- 1. Insere perfis em falta
  INSERT INTO public.profiles (id, email, role, is_password_set, created_at)
  SELECT 
      id, 
      email, 
      CASE WHEN email = 'edutechpt@hotmail.com' THEN 'admin'::user_role ELSE 'aluno'::user_role END,
      FALSE,
      created_at
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles);
  
  -- 2. Atualiza emails desatualizados
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '' OR p.email != u.email);

  -- 3. Garante Admin
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'edutechpt@hotmail.com';
END;
$$ LANGUAGE plpgsql;

-- 8. PERFORMANCE (ÍNDICES)
-- Resolve avisos de "Unindexed foreign keys" para melhor performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_integrations_updated_by ON public.system_integrations(updated_by);

-- Tenta criar índices em tabelas que podem não existir (Legacy)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_certs_user ON public.user_certifications(user_id);
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
EXCEPTION WHEN undefined_table THEN null; END $$;

-- 9. SINCRONIZAÇÃO DE DADOS (Execução imediata)
SELECT sync_profiles();

-- 10. FORCE ADMIN (Reforço final)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'edutechpt@hotmail.com';

-- 11. VERSIONAMENTO DE SQL
INSERT INTO public.system_integrations (key, value, updated_at)
VALUES ('sql_version', '{"version": "${CURRENT_SQL_VERSION}"}', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
`;