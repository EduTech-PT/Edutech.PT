import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { CheckCircle, PlayCircle, ArrowRight, HelpCircle, X, Mail, Send } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const Landing: React.FC = () => {
  // Estado para Conteúdo Dinâmico com Defaults
  const [content, setContent] = useState({
      heroTitle: 'Formação profissional simples e eficaz.',
      heroSubtitle: 'Plataforma integrada para gestão de cursos, alunos e formadores. Interface moderna, rápida e focada na experiência de aprendizagem.',
      ctaPrimary: 'Começar Agora',
      ctaSecondary: 'Demonstração'
  });

  // Estado para Configuração do Formulário de Ajuda
  const [helpConfig, setHelpConfig] = useState({
      buttonText: 'Dúvidas / Ajuda',
      modalTitle: 'Como podemos ajudar?',
      adminEmail: 'edutechpt@hotmail.com',
      subjectPrefix: '[EduTech] Dúvida:',
      helperText: 'Preencha os campos abaixo. Ao clicar em Enviar, o seu cliente de email será aberto com a mensagem pré-preenchida.'
  });

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // Estados do Formulário
  const [formData, setFormData] = useState({ name: '', email: '', message: '', subject: '' });

  // Tentar carregar textos personalizados (mesmo para anonimos, se RLS permitir)
  useEffect(() => {
    if (isSupabaseConfigured) {
        supabase.from('system_integrations')
            .select('key, value')
            .in('key', ['landing_page_content', 'help_form_config'])
            .then(({ data, error }) => {
                if (!error && data) {
                    data.forEach((item: any) => {
                        if (item.key === 'landing_page_content') setContent(prev => ({ ...prev, ...item.value }));
                        if (item.key === 'help_form_config') setHelpConfig(prev => ({ ...prev, ...item.value }));
                    });
                }
            });
    }
  }, []);

  const handleHelpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const subject = `${helpConfig.subjectPrefix} ${formData.subject}`;
      const body = `Nome: ${formData.name}\nEmail: ${formData.email}\n\nMensagem:\n${formData.message}`;
      
      // Construir link mailto seguro
      const mailtoLink = `mailto:${helpConfig.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.location.href = mailtoLink;
      setIsHelpModalOpen(false);
      setFormData({ name: '', email: '', message: '', subject: '' });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex flex-col md:flex-row justify-between items-center relative z-20 glass-panel border-x-0 border-t-0 rounded-none gap-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">E</div>
           <span className="text-xl font-bold text-slate-800 tracking-tight">EduTech PT</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
           {/* Botão de Ajuda */}
           <button 
             onClick={() => setIsHelpModalOpen(true)}
             className="px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-white/50 transition-all flex items-center gap-2 text-sm border border-transparent hover:border-slate-200"
           >
             <HelpCircle size={18} />
             {helpConfig.buttonText}
           </button>

          <Link to="/login" className="px-5 py-2 rounded-xl text-indigo-600 font-medium hover:bg-white/50 transition-all">
            Área de Cliente
          </Link>
          <Link to="/login" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
            {content.ctaPrimary}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative z-10">
        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-wide uppercase mb-6 border border-indigo-200">
          A Evolução do Ensino
        </span>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight max-w-4xl leading-tight">
          {content.heroTitle.includes('simples') ? (
              <>
                 Formação profissional <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">simples e eficaz.</span>
              </>
          ) : content.heroTitle}
        </h1>
        
        {/* Render HTML Content for Subtitle */}
        <div 
            className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed prose prose-slate prose-lg"
            dangerouslySetInnerHTML={{ __html: content.heroSubtitle }}
        />
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/login" className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            {content.ctaPrimary} <ArrowRight size={20} />
          </Link>
          <button className="px-8 py-4 rounded-2xl bg-white/60 text-slate-700 font-semibold text-lg hover:bg-white hover:text-indigo-600 border border-white transition-all backdrop-blur-sm flex items-center justify-center gap-2">
            <PlayCircle size={20} /> {content.ctaSecondary}
          </button>
        </div>
      </header>

      {/* Course Showcase */}
      <section className="px-4 py-20 max-w-7xl mx-auto w-full relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Cursos em Destaque</h2>
            <p className="text-slate-500 mt-2">Explore as formações mais procuradas.</p>
          </div>
          <button className="text-indigo-600 font-medium hover:underline">Ver todos os cursos</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Gestão de Projetos Ágeis', desc: 'Domine Scrum e Kanban em 4 semanas.', tag: 'Gestão' },
            { title: 'React Avançado & TypeScript', desc: 'Arquitetura de software escalável.', tag: 'Tecnologia' },
            { title: 'Marketing Digital 360', desc: 'Estratégias de SEO, SEM e Social Media.', tag: 'Marketing' },
          ].map((course, idx) => (
            <GlassCard key={idx} className="group hover:-translate-y-2 transition-transform duration-300">
              <div className="h-48 rounded-xl bg-slate-200 mb-6 overflow-hidden relative">
                <img 
                  src={`https://picsum.photos/400/300?random=${idx}`} 
                  alt={course.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-md rounded-md text-xs font-bold text-indigo-700 shadow-sm">
                  {course.tag}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{course.title}</h3>
              <p className="text-slate-500 mb-4">{course.desc}</p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle size={16} className="text-emerald-500" /> Certificado Incluído
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-lg border-t border-white/40 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="mb-2">&copy; {new Date().getFullYear()} EduTech PT. Todos os direitos reservados.</p>
          <p>Design Glassmorphism Moderno • Stack React & Supabase</p>
        </div>
      </footer>

      {/* MODAL DE AJUDA / DÚVIDAS */}
      {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <GlassCard className="w-full max-w-lg shadow-2xl border-white/80 bg-white/90 relative">
                  <button 
                    onClick={() => setIsHelpModalOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                      <X size={24} />
                  </button>

                  <div className="mb-6">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                          <HelpCircle size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">{helpConfig.modalTitle}</h3>
                      <p className="text-slate-500 mt-2 text-sm">
                          {helpConfig.helperText}
                      </p>
                  </div>

                  <form onSubmit={handleHelpSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">O seu nome</label>
                              <input 
                                  type="text" 
                                  required
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">O seu email</label>
                              <input 
                                  type="email" 
                                  required
                                  value={formData.email}
                                  onChange={e => setFormData({...formData, email: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Assunto</label>
                          <input 
                              type="text" 
                              required
                              value={formData.subject}
                              onChange={e => setFormData({...formData, subject: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                              placeholder="Sobre o que quer falar?"
                          />
                      </div>

                      <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Mensagem</label>
                          <textarea 
                              required
                              rows={4}
                              value={formData.message}
                              onChange={e => setFormData({...formData, message: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                              placeholder="Escreva aqui a sua dúvida ou pedido..."
                          />
                      </div>

                      <div className="pt-2">
                          <button 
                              type="submit" 
                              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          >
                              <Mail size={18} />
                              Abrir Email e Enviar
                          </button>
                      </div>
                  </form>
              </GlassCard>
          </div>
      )}
    </div>
  );
};