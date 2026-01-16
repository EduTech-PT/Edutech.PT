import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  Database,
  Shield,
  FileText,
  LayoutTemplate
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('EduTech PT');

  // Fetch Logo e Nome
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.from('system_integrations').select('value').eq('key', 'site_branding').single()
        .then(({ data }) => {
          if (data?.value) {
            if (data.value.logoUrl) setLogoUrl(data.value.logoUrl);
            if (data.value.siteName) setSiteName(data.value.siteName);
          }
        });
    }
  }, []);

  if (!user) return null;

  const getMenuItems = () => {
    const items = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'editor', 'formador', 'aluno'] },
      { icon: BookOpen, label: 'Cursos', path: '/dashboard/courses', roles: ['admin', 'formador', 'aluno'] },
    ];

    if (user.role === 'admin' || user.role === 'editor') {
      items.push({ icon: Users, label: 'Utilizadores', path: '/dashboard/users', roles: ['admin', 'editor'] });
    }

    if (user.role === 'admin') {
      items.push(
        { icon: Database, label: 'Dados SQL', path: '/dashboard/sql', roles: ['admin'] },
        { icon: LayoutTemplate, label: 'Editor de Site', path: '/dashboard/site-content', roles: ['admin'] },
        { icon: Shield, label: 'Permissões', path: '/dashboard/permissions', roles: ['admin'] },
        { icon: Settings, label: 'Integrações', path: '/dashboard/settings', roles: ['admin'] }
      );
    }
    
    // Alunos podem ver os seus certificados/materiais
    if (user.role === 'aluno') {
       items.push({ icon: FileText, label: 'Meus Materiais', path: '/dashboard/materials', roles: ['aluno'] });
    }

    return items;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-sidebar flex flex-col transition-all duration-300 z-20">
      <div className="p-6 flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            E
          </div>
        )}
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 truncate">
          {siteName}
        </span>
      </div>

      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Menu Principal
        </div>
        {getMenuItems().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/50' 
                : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'}
            `}
          >
            <item.icon size={20} className="opacity-70 group-hover:opacity-100" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/40">
        <Link 
          to="/dashboard/profile"
          className="flex items-center gap-3 mb-4 px-2 py-2 -mx-2 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group"
          title="Editar Perfil"
        >
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-white overflow-hidden group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.full_name?.charAt(0) || user.email.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
              {user.full_name || 'Sem Nome'}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user.role}
            </p>
          </div>
        </Link>
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};