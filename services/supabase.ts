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
export const CURRENT_SQL_VERSION = 'v1.5.9';

/**
 * INSTRUÇÕES SQL PARA SUPABASE (DATABASE-FIRST)
 * Execute este script no SQL Editor do Supabase para corrigir e criar a estrutura necessária.
 */
export const REQUIRED_SQL_SCHEMA = `
-- 1. EXTENSÕES & MIGRAÇÃO INICIAL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CORREÇÃO DE ESTRUTURA
DO $$ 
BEGIN 
    -- Verifica se a tabela profiles existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN 
            ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); 
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN 
            ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE; 
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'student_number') THEN 
            ALTER TABLE public.profiles ADD COLUMN student_number BIGINT; 
        END IF;
    END IF;

    -- FIX v1.2.33: Garante colunas courses
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'cover_image') THEN 
            ALTER TABLE public.courses ADD COLUMN cover_image TEXT; 
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'status') THEN 
            ALTER TABLE public.courses ADD COLUMN status TEXT DEFAULT 'draft'; 
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'details') THEN 
            ALTER TABLE public.courses ADD COLUMN details JSONB DEFAULT '{}'::jsonb; 
        END IF;
    END IF;
END $$;

-- Sequência para IDs (Começa em 10000)
CREATE SEQUENCE IF NOT EXISTS public.user_id_seq START 10000;

-- FIX FK Constraints
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

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_invites') THEN
        ALTER TABLE public.user_invites DROP CONSTRAINT IF EXISTS user_invites_invited_by_fkey;
        ALTER TABLE public.user_invites 
        ADD CONSTRAINT user_invites_invited_by_fkey 
        FOREIGN KEY (invited_by) 
        REFERENCES public.profiles(id)
        ON DELETE SET NULL; 
    END IF;
END $$;

-- 2. FUNÇÕES AUXILIARES
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

-- 4. TABELAS

-- NOVA TABELA v1.5.0: Turmas
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  student_number BIGINT DEFAULT nextval('public.user_id_seq'),
  avatar_url TEXT,
  role user_role DEFAULT 'aluno',
  is_password_set BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- v1.5.0: Adicionar class_id a profiles com nome explícito para facilitar joins
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'class_id') THEN 
        ALTER TABLE public.profiles ADD COLUMN class_id UUID;
    END IF;
    
    -- Recriar Constraint para garantir nome correto
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_class_id_fkey;
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_class_id_fkey 
    FOREIGN KEY (class_id) 
    REFERENCES public.classes(id) 
    ON DELETE SET NULL;
END $$;

-- Correção de FK Profiles Auth
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

-- v1.5.0: Adicionar class_id a user_invites
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invites' AND column_name = 'class_id') THEN 
        ALTER TABLE public.user_invites ADD COLUMN class_id UUID;
    END IF;

    ALTER TABLE public.user_invites DROP CONSTRAINT IF EXISTS user_invites_class_id_fkey;
    ALTER TABLE public.user_invites 
    ADD CONSTRAINT user_invites_class_id_fkey 
    FOREIGN KEY (class_id) 
    REFERENCES public.classes(id) 
    ON DELETE SET NULL;
END $$;

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

-- NOVO v1.4.8: Tabela de Materiais
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf', 'video', 'link', 'archive')),
  url TEXT NOT NULL,
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

-- ==============================================================================
-- NOVO (v1.5.3): SISTEMA DE AUDIT LOGS GRATUITO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID, -- ID do registo afetado
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB, -- Dados antes da alteração
  new_data JSONB, -- Dados depois da alteração
  changed_by UUID REFERENCES public.profiles(id), -- Quem fez a alteração
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS no Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas Admins podem ver os logs
DROP POLICY IF EXISTS "Admins ver audit_logs" ON public.audit_logs;
CREATE POLICY "Admins ver audit_logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- Função Trigger Genérica para Logs
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    curr_user_id UUID;
BEGIN
    -- Tenta obter o ID do utilizador atual
    BEGIN
        curr_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        curr_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), curr_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), curr_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), curr_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar Triggers nas Tabelas Críticas
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_courses_trigger ON public.courses;
CREATE TRIGGER audit_courses_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_classes_trigger ON public.classes;
CREATE TRIGGER audit_classes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_user_invites_trigger ON public.user_invites;
CREATE TRIGGER audit_user_invites_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_invites
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ==============================================================================

-- 5. SEGURANÇA RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Limpeza de Políticas Antigas
DROP POLICY IF EXISTS "Perfis visíveis publicamente" ON public.profiles;
DROP POLICY IF EXISTS "Gestão de Perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins apagam perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- NOVAS POLÍTICAS (Profiles)
CREATE POLICY "Perfis visíveis publicamente" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Gestão de Perfis" ON public.profiles FOR UPDATE USING ( (select auth.uid()) = id OR public.is_admin() );
CREATE POLICY "Admins apagam perfis" ON public.profiles FOR DELETE USING (public.is_admin());

-- Outras Políticas
DROP POLICY IF EXISTS "Admins gerem convites" ON public.user_invites;
CREATE POLICY "Admins gerem convites" ON public.user_invites FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Ver cursos" ON public.courses;
CREATE POLICY "Ver cursos" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerir cursos (Privileged) ALL" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) INSERT" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) UPDATE" ON public.courses;
DROP POLICY IF EXISTS "Gerir cursos (Privileged) DELETE" ON public.courses;

CREATE POLICY "Gerir cursos (Privileged) INSERT" ON public.courses FOR INSERT WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) UPDATE" ON public.courses FOR UPDATE USING (public.is_privileged());
CREATE POLICY "Gerir cursos (Privileged) DELETE" ON public.courses FOR DELETE USING (public.is_privileged());

-- Políticas de Materiais
-- FIX: Remove possíveis duplicados com nomes antigos
DROP POLICY IF EXISTS "Ver materiais" ON public.course_materials;
DROP POLICY IF EXISTS "Ver materiais (Publico por enquanto ou Enrollment)" ON public.course_materials;

CREATE POLICY "Ver materiais" ON public.course_materials FOR SELECT USING (true); 

DROP POLICY IF EXISTS "Gerir materiais (Privileged)" ON public.course_materials;
DROP POLICY IF EXISTS "Gerir materiais INSERT" ON public.course_materials;
DROP POLICY IF EXISTS "Gerir materiais UPDATE" ON public.course_materials;
DROP POLICY IF EXISTS "Gerir materiais DELETE" ON public.course_materials;

CREATE POLICY "Gerir materiais INSERT" ON public.course_materials FOR INSERT WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir materiais UPDATE" ON public.course_materials FOR UPDATE USING (public.is_privileged());
CREATE POLICY "Gerir materiais DELETE" ON public.course_materials FOR DELETE USING (public.is_privileged());

-- Políticas de Matriculas
DROP POLICY IF EXISTS "Ver matriculas" ON public.enrollments;
CREATE POLICY "Ver matriculas" ON public.enrollments FOR SELECT USING (public.is_privileged() OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Gerir matriculas (Admin) ALL" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) INSERT" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) UPDATE" ON public.enrollments;
DROP POLICY IF EXISTS "Gerir matriculas (Admin) DELETE" ON public.enrollments;

CREATE POLICY "Gerir matriculas (Admin) INSERT" ON public.enrollments FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) UPDATE" ON public.enrollments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Gerir matriculas (Admin) DELETE" ON public.enrollments FOR DELETE USING (public.is_admin());

-- Políticas de Integrações
DROP POLICY IF EXISTS "Ver integrações" ON public.system_integrations;
CREATE POLICY "Ver integrações" ON public.system_integrations FOR SELECT USING (public.is_admin() OR key IN ('landing_page_content', 'resize_pixel_instructions', 'sql_version', 'profile_upload_hint', 'help_form_config', 'site_branding', 'email_invite_config'));

DROP POLICY IF EXISTS "Admins gerem integrações ALL" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações INSERT" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações UPDATE" ON public.system_integrations;
DROP POLICY IF EXISTS "Admins gerem integrações DELETE" ON public.system_integrations;

CREATE POLICY "Admins gerem integrações INSERT" ON public.system_integrations FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins gerem integrações UPDATE" ON public.system_integrations FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins gerem integrações DELETE" ON public.system_integrations FOR DELETE USING (public.is_admin());

-- v1.5.0: Políticas de Turmas
DROP POLICY IF EXISTS "Ver turmas" ON public.classes;
CREATE POLICY "Ver turmas" ON public.classes FOR SELECT USING (true);

-- FIX v1.5.5: Loop Robusto para limpar políticas duplicadas/colisões na tabela classes
DO $$
DECLARE
  pol record;
BEGIN
  -- Percorre e elimina todas as políticas da tabela classes que contenham "Gerir turmas"
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'classes' AND policyname LIKE 'Gerir turmas%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.classes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Gerir turmas (Privileged) INSERT" ON public.classes FOR INSERT WITH CHECK (public.is_privileged());
CREATE POLICY "Gerir turmas (Privileged) UPDATE" ON public.classes FOR UPDATE USING (public.is_privileged());
CREATE POLICY "Gerir turmas (Privileged) DELETE" ON public.classes FOR DELETE USING (public.is_privileged());


-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invited_role user_role;
  invited_class UUID;
BEGIN
  -- v1.5.0: Agora também busca o class_id do convite
  SELECT role, class_id INTO invited_role, invited_class FROM public.user_invites WHERE email = new.email;

  IF invited_role IS NULL THEN
     IF new.email = 'edutechpt@hotmail.com' THEN
        invited_role := 'admin';
     ELSE
        invited_role := 'aluno';
     END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_password_set, student_number, class_id, created_at)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    invited_role,
    FALSE,
    nextval('public.user_id_seq'),
    invited_class, -- Insere a turma automaticamente
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

-- 7. RPC FUNCTIONS
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

-- Atualizado v1.5.9 para garantir remoção de assinatura antiga e recriação com NULL default
DROP FUNCTION IF EXISTS create_invite(text, user_role);
DROP FUNCTION IF EXISTS create_invite(text, user_role, uuid);

CREATE OR REPLACE FUNCTION create_invite(email_input TEXT, role_input user_role, class_input UUID DEFAULT NULL)
RETURNS VOID 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar.';
  END IF;

  INSERT INTO public.user_invites (email, role, invited_by, class_id)
  VALUES (email_input, role_input, (select auth.uid()), class_input)
  ON CONFLICT (email) DO UPDATE SET role = role_input, class_id = class_input, invited_at = NOW();
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
  UPDATE public.profiles SET role = new_role WHERE id = ANY(user_ids) AND id != (select auth.uid()); 
END;
$$ LANGUAGE plpgsql;

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
  SELECT array_agg(email) INTO target_emails FROM auth.users WHERE id = ANY(user_ids);
  IF target_emails IS NOT NULL THEN
    DELETE FROM public.user_invites WHERE email = ANY(target_emails);
  END IF;
  DELETE FROM auth.users WHERE id = ANY(user_ids) AND id != (select auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Sincronização e Reparação
DROP FUNCTION IF EXISTS sync_profiles();
CREATE OR REPLACE FUNCTION sync_profiles()
RETURNS TEXT 
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
    inserted_count INT;
    updated_count INT;
BEGIN
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
  
  WITH updated AS (
      UPDATE public.profiles p
      SET email = u.email
      FROM auth.users u
      WHERE p.id = u.id AND (p.email IS NULL OR p.email = '' OR p.email != u.email)
      RETURNING 1
  )
  SELECT count(*) INTO updated_count FROM updated;
  
  RETURN 'Sincronização concluída. Novos perfis: ' || inserted_count || '. Atualizados: ' || updated_count || '.';
END;
$$ LANGUAGE plpgsql;

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_integrations_updated_by ON public.system_integrations(updated_by);
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_number);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON public.course_materials(course_id);
-- v1.5.0 Indexes
CREATE INDEX IF NOT EXISTS idx_classes_course ON public.classes(course_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class ON public.profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_class ON public.user_invites(class_id);

-- 9. EXECUÇÃO DE EMERGÊNCIA (FORCE ADMIN)
-- Este bloco garante que o admin principal tem sempre perfil e ID 10000
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    SELECT id INTO admin_uid FROM auth.users WHERE email = 'edutechpt@hotmail.com';
    
    IF admin_uid IS NOT NULL THEN
        -- Tenta inserir ou atualizar o perfil do admin
        INSERT INTO public.profiles (id, email, full_name, role, is_password_set, student_number)
        VALUES (admin_uid, 'edutechpt@hotmail.com', 'Administrador Principal', 'admin', TRUE, 10000)
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin',
            student_number = 10000; -- Garante que o ID é 10000
    END IF;
END $$;

-- Atualizar versão
INSERT INTO public.system_integrations (key, value, updated_at)
VALUES ('sql_version', '{"version": "${CURRENT_SQL_VERSION}"}', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

SELECT sync_profiles();
`;