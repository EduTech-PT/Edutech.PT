
export type UserRole = 'admin' | 'editor' | 'formador' | 'aluno';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  student_number?: number; // Novo ID visível sequencial
  role: UserRole;
  avatar_url?: string;
  is_password_set?: boolean; // Útil para controlo de fluxo no frontend
  created_at: string;
  class_id?: string; // FK para Turma
  classes?: { name: string }; // Join
}

export interface CourseDetailField {
  value: string;
  visible: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  cover_image?: string;
  status: 'draft' | 'published' | 'archived';
  details?: Record<string, CourseDetailField>;
  created_at: string;
  profiles?: { full_name: string }; // Join
}

export interface Class {
  id: string;
  name: string;
  course_id?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  courses?: { title: string }; // Join
  student_count?: number; // Count
}

export interface Material {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'archive';
  url: string;
  created_at: string;
  courses?: { title: string }; // Join
}

export interface Session {
  user: User | null;
  access_token: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}
