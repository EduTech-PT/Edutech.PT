
import React, { useState, useEffect } from 'react';
import { Logo } from '../constants';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onOpenLogin, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 sm:px-8`}>
      <div className={`max-w-7xl mx-auto rounded-2xl transition-all duration-500 ${scrolled ? 'liquid-glass px-6 py-3 shadow-xl' : 'bg-transparent py-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              EduTech <span className="text-blue-600">PT</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition-colors">Início</a>
            <a href="#cursos" className="hover:text-blue-600 transition-colors">Cursos</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Vantagens</a>
            <a href="#ai-tutor" className="hover:text-blue-600 transition-colors">Tutor IA</a>
            {user?.role === 'admin' && (
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Modo Admin</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-xs text-slate-500 font-medium">{user.email}</span>
                <button 
                  onClick={onLogout}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Sair
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={onOpenLogin}
                  className="hidden sm:block text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Entrar
                </button>
                <button 
                  onClick={onOpenLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Experimentar Grátis
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
