export type UserRole = 'admin' | 'editor' | 'formador' | 'aluno';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  cover_image?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
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