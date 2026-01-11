
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  duration: string;
}

export interface User {
  email: string;
  role: 'admin' | 'student';
}

export interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}
