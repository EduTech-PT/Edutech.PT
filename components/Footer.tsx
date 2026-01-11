
import React from 'react';
import { Logo, APP_VERSION } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <Logo className="w-8 h-8" />
              <span className="text-lg font-bold tracking-tight text-slate-900">EduTech PT</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Capacitando a próxima geração de líderes tecnológicos em Portugal com educação de qualidade e tecnologia acessível.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Plataforma</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Todos os Cursos</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Mentoria Individual</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Empresas</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Certificações</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Suporte</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Centro de Ajuda</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Comunidade</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Contactos</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Status do Servidor</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Novidades</h4>
            <p className="text-sm text-slate-500 mb-4">Subscreva a nossa newsletter para receber dicas semanais.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">OK</button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-xs text-slate-400">© 2024 EduTech PT. Todos os direitos reservados.</p>
            <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded border border-slate-100 font-mono">
              {APP_VERSION}
            </span>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600">Termos de Uso</a>
            <a href="#" className="hover:text-slate-600">Privacidade</a>
            <a href="#" className="hover:text-slate-600">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
