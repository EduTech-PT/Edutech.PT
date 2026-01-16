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
export const CURRENT_SQL_VERSION = 'v1.2.34';

/**
 * INSTRUÇÕES SQL PARA SUPABASE (DATABASE-FIRST)
 * Execute este script no SQL Editor do Supabase para corrigir e criar a estrutura necessária.
 */
export const REQUIRED_SQL_SCHEMA = `
-- 1. EXTENSÕES & MIGRAÇÃO INICIAL (PRIORITÁRIA)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CORREÇÃO DE ESTRUTURA ANTES DE TUDO
DO $$ 
BEGIN 
    -- Verifica se a tabela profiles existe, se não, não faz nada (será criada abaixo)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN 
            ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); 
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN 
            ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE; 
        END IF;
    END IF;

    -- FIX v1.2.33: Garante que a tabela courses tem a coluna cover_image e status
    -- Isto corrige o erro "Could not find the 'cover_image' column" se a tabela já existia sem ela
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'cover_image') THEN 
            ALTER TABLE public.courses ADD COLUMN cover_image TEXT; 
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'status') THEN 
            ALTER TABLE public.courses ADD COLUMN status TEXT DEFAULT 'draft'; 
        END IF;
    END IF;
END $$;

-- 2. FUNÇÕES AUXILIARES DE SEGURANÇA
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

-- Limpeza de políticas antigas para evitar conflitos
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

-- NOVAS POLÍTICAS
CREATE POLICY "Perfis visíveis publicamente" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Gestão de Perfis" ON public.profiles FOR UPDATE 
USING ( (select auth.uid()) = id OR public.is_admin() );
CREATE POLICY "Admins apagam perfis" ON public.profiles FOR DELETE
USING (public.is_admin());

CREATE POLICY "Ver cursos" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Gerir cursos (Privileged) INSERT" ON public.courses FOR INSERT
WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) UPDATE" ON public.courses FOR UPDATE
USING (public.is_privileged()) WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) DELETE" ON public.courses FOR DELETE
USING (public.is_privileged());

CREATE POLICY "Ver matriculas" ON public.enrollments FOR SELECT
USING (public.is_privileged() OR user_id = (select auth.uid()));
CREATE POLICY "Gerir matriculas (Admin) INSERT" ON public.enrollments FOR INSERT
WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) UPDATE" ON public.enrollments FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) DELETE" ON public.enrollments FOR DELETE
USING (public.is_admin());

-- ATUALIZAÇÃO v1.2.31: Adicionado 'help_form_config' à lista de chaves permitidas para leitura
CREATE POLICY "Ver integrações" ON public.system_integrations FOR SELECT
USING (public.is_admin() OR key IN ('landing_page_content', 'resize_pixel_instructions', 'sql_version', 'profile_upload_hint', 'help_form_config'));

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
  INSERT INTO public.profiles (id, email, full_name, role, is_password_set, created_at)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN new.email = 'edutechpt@hotmail.com' THEN 'admin'::user_role 
      ELSE 'aluno'::user_role 
    END,
    FALSE,
    NOW()
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

-- 7. RPC & SINCRONIZAÇÃO

-- Função para verificar email e estado da password
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

-- Atualização em Massa de Roles
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

-- Remoção em Massa
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

-- Sincronização de Perfis (Versão Melhorada com Feedback)
DROP FUNCTION IF EXISTS sync_profiles(); -- Remove versão antiga que retornava VOID

CREATE OR REPLACE FUNCTION sync_profiles()
RETURNS TEXT 
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
    inserted_count INT;
    updated_count INT;
BEGIN
  -- 1. Insere perfis em falta
  WITH inserted AS (
      INSERT INTO public.profiles (id, email, role, is_password_set, created_at)
      SELECT 
          id, 
          email, 
          CASE WHEN email = 'edutechpt@hotmail.com' THEN 'admin'::user_role ELSE 'aluno'::user_role END,
          FALSE,
          created_at
      FROM auth.users
      WHERE id NOT IN (SELECT id FROM public.profiles)
      RETURNING 1
  )
  SELECT count(*) INTO inserted_count FROM inserted;
  
  -- 2. Atualiza emails desatualizados
  WITH updated AS (
      UPDATE public.profiles p
      SET email = u.email
      FROM auth.users u
      WHERE p.id = u.id AND (p.email IS NULL OR p.email = '' OR p.email != u.email)
      RETURNING 1
  )
  SELECT count(*) INTO updated_count FROM updated;

  -- 3. Garante Admin
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'edutechpt@hotmail.com';
  
  RETURN 'Sincronização concluída. Novos perfis: ' || inserted_count || '. Atualizados: ' || updated_count || '.';
END;
$$ LANGUAGE plpgsql;

-- 8. INDEXES & CLEANUP
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_integrations_updated_by ON public.system_integrations(updated_by);

-- Cleanup de tabelas antigas e não utilizadas para remover alertas de segurança
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.user_certifications CASCADE;

-- 9. EXECUÇÃO FINAL
SELECT sync_profiles();

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'edutechpt@hotmail.com';

INSERT INTO public.system_integrations (key, value, updated_at)
VALUES ('sql_version', '{"version": "${CURRENT_SQL_VERSION}"}', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
`;