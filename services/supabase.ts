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
export const CURRENT_SQL_VERSION = 'v1.4.5';

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
        
        -- NOVO v1.4.5: Coluna Student Number (ID Visível)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'student_number') THEN 
            ALTER TABLE public.profiles ADD COLUMN student_number BIGINT; 
        END IF;
    END IF;

    -- FIX v1.2.33: Garante que a tabela courses tem a coluna cover_image e status
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'cover_image') THEN 
            ALTER TABLE public.courses ADD COLUMN cover_image TEXT; 
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'status') THEN 
            ALTER TABLE public.courses ADD COLUMN status TEXT DEFAULT 'draft'; 
        END IF;

        -- FIX v1.3.0: Adiciona coluna JSONB para detalhes estendidos do curso
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'details') THEN 
            ALTER TABLE public.courses ADD COLUMN details JSONB DEFAULT '{}'::jsonb; 
        END IF;
    END IF;
END $$;

-- NOVO v1.4.5: Sequência para IDs únicos visíveis
CREATE SEQUENCE IF NOT EXISTS public.user_id_seq START 10000;

-- FIX v1.2.35: Forçar recriação da constraint FK para garantir que o JOIN funciona
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
        ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_instructor_id_fkey 
        FOREIGN KEY (instructor_id) 
        REFERENCES public.profiles(id);
    END IF;
END $$;

-- FIX v1.4.3: Garantir que a tabela user_invites não impede a eliminação de admins (invited_by)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_invites') THEN
        ALTER TABLE public.user_invites DROP CONSTRAINT IF EXISTS user_invites_invited_by_fkey;
        
        ALTER TABLE public.user_invites 
        ADD CONSTRAINT user_invites_invited_by_fkey 
        FOREIGN KEY (invited_by) 
        REFERENCES public.profiles(id)
        ON DELETE SET NULL; -- Se o admin for apagado, o convite permanece mas sem "remetente"
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
  student_number BIGINT DEFAULT nextval('public.user_id_seq'), -- Novo ID visível
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

CREATE TABLE IF NOT EXISTS public.user_invites (
  email TEXT PRIMARY KEY,
  role user_role DEFAULT 'aluno',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  cover_image TEXT,
  status TEXT DEFAULT 'draft',
  details JSONB DEFAULT '{}'::jsonb,
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
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_integrations ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas antigas (Profiles)
DROP POLICY IF EXISTS "Perfis visíveis publicamente" ON public.profiles;
DROP POLICY IF EXISTS "Gestão de Perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins apagam perfis" ON public.profiles;

-- Limpeza de políticas antigas (User Invites)
DROP POLICY IF EXISTS "Admins gerem convites" ON public.user_invites;
DROP POLICY IF EXISTS "Ver convites (Admin)" ON public.user_invites;

-- NOVAS POLÍTICAS (Profiles)
CREATE POLICY "Perfis visíveis publicamente" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Gestão de Perfis" ON public.profiles FOR UPDATE 
USING ( (select auth.uid()) = id OR public.is_admin() );
CREATE POLICY "Admins apagam perfis" ON public.profiles FOR DELETE
USING (public.is_admin());

-- Políticas para user_invites
CREATE POLICY "Admins gerem convites" ON public.user_invites FOR ALL
USING (public.is_admin());

-- Políticas de Cursos (Limpeza e Criação)
DROP POLICY IF EXISTS "Ver cursos" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) INSERT" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) UPDATE" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) DELETE" ON public.courses;

CREATE POLICY "Ver cursos" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Gerir cursos (Privileged) INSERT" ON public.courses FOR INSERT
WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) UPDATE" ON public.courses FOR UPDATE
USING (public.is_privileged()) WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) DELETE" ON public.courses FOR DELETE
USING (public.is_privileged());

-- Políticas de Matriculas (Limpeza e Criação)
DROP POLICY IF EXISTS "Ver matriculas" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) INSERT" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) UPDATE" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) DELETE" ON public.enrollments;

CREATE POLICY "Ver matriculas" ON public.enrollments FOR SELECT
USING (public.is_privileged() OR user_id = (select auth.uid()));
CREATE POLICY "Gerir matriculas (Admin) INSERT" ON public.enrollments FOR INSERT
WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) UPDATE" ON public.enrollments FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) DELETE" ON public.enrollments FOR DELETE
USING (public.is_admin());

-- Políticas de Integrações (Limpeza e Criação)
DROP POLICY IF EXISTS "Ver integrações" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações INSERT" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações UPDATE" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações DELETE" ON public.system_integrations;

CREATE POLICY "Ver integrações" ON public.system_integrations FOR SELECT
USING (public.is_admin() OR key IN ('landing_page_content', 'resize_pixel_instructions', 'sql_version', 'profile_upload_hint', 'help_form_config', 'site_branding', 'email_invite_config'));

CREATE POLICY "Admins gerem integrações INSERT" ON public.system_integrations FOR INSERT
WITH CHECK (public.is_admin());
CREATE POLICY "Admins gerem integrações UPDATE" ON public.system_integrations FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins gerem integrações DELETE" ON public.system_integrations FOR DELETE
USING (public.is_admin());


-- 6. TRIGGERS ATUALIZADOS
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invited_role user_role;
BEGIN
  SELECT role INTO invited_role FROM public.user_invites WHERE email = new.email;

  IF invited_role IS NULL THEN
     IF new.email = 'edutechpt@hotmail.com' THEN
        invited_role := 'admin';
     ELSE
        invited_role := 'aluno';
     END IF;
  END IF;

  -- v1.4.5: Insere student_number via nextval
  INSERT INTO public.profiles (id, email, full_name, role, is_password_set, student_number, created_at)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    invited_role,
    FALSE,
    nextval('public.user_id_seq'),
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

-- 7. RPC & FUNÇÕES DE GESTÃO (ATUALIZADO V1.4.3)

CREATE OR REPLACE FUNCTION check_user_status_extended(email_input TEXT)
RETURNS JSONB 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  found_user public.profiles%ROWTYPE;
  found_invite public.user_invites%ROWTYPE;
BEGIN
  SELECT * INTO found_user FROM public.profiles WHERE email = email_input;
  
  IF found_user.id IS NOT NULL THEN
    RETURN jsonb_build_object('exists', true, 'is_password_set', COALESCE(found_user.is_password_set, false), 'is_invited', false);
  END IF;

  SELECT * INTO found_invite FROM public.user_invites WHERE email = email_input;
  
  IF found_invite.email IS NOT NULL THEN
     RETURN jsonb_build_object('exists', false, 'is_password_set', false, 'is_invited', true);
  END IF;

  RETURN jsonb_build_object('exists', false, 'is_invited', false);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_invite(email_input TEXT, role_input user_role)
RETURNS VOID 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar.';
  END IF;

  INSERT INTO public.user_invites (email, role, invited_by)
  VALUES (email_input, role_input, (select auth.uid()))
  ON CONFLICT (email) DO UPDATE SET role = role_input, invited_at = NOW();
END;
$$ LANGUAGE plpgsql;

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

-- UPDATE v1.4.4: Eliminar também da tabela user_invites para evitar que o utilizador
-- receba OTP de registo caso tente entrar novamente com o mesmo email.
CREATE OR REPLACE FUNCTION bulk_delete_users(user_ids UUID[])
RETURNS VOID 
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
   target_emails TEXT[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem realizar esta ação.';
  END IF;

  -- 1. Obter emails dos utilizadores a eliminar
  SELECT array_agg(email) INTO target_emails
  FROM auth.users
  WHERE id = ANY(user_ids);

  -- 2. Eliminar da tabela de convites (remove a permissão de re-registo)
  IF target_emails IS NOT NULL THEN
    DELETE FROM public.user_invites
    WHERE email = ANY(target_emails);
  END IF;

  -- 3. Eliminar da tabela de autenticação (Cascade elimina o perfil automaticamente)
  DELETE FROM auth.users 
  WHERE id = ANY(user_ids)
  AND id != (select auth.uid()); -- Impede auto-eliminação
END;
$$ LANGUAGE plpgsql;

-- Sincronização de Perfis
DROP FUNCTION IF EXISTS sync_profiles();
CREATE OR REPLACE FUNCTION sync_profiles()
RETURNS TEXT 
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
    inserted_count INT;
    updated_count INT;
BEGIN
  -- 1. Insere perfis em falta (agora com student_number)
  WITH inserted AS (
      INSERT INTO public.profiles (id, email, role, is_password_set, student_number, created_at)
      SELECT 
          id, 
          email, 
          CASE WHEN email = 'edutechpt@hotmail.com' THEN 'admin'::user_role ELSE 'aluno'::user_role END,
          FALSE,
          nextval('public.user_id_seq'),
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
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_number);

-- 9. EXECUÇÃO FINAL
SELECT sync_profiles();

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'edutechpt@hotmail.com';

INSERT INTO public.system_integrations (key, value, updated_at)
VALUES ('sql_version', '{"version": "${CURRENT_SQL_VERSION}"}', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
`;