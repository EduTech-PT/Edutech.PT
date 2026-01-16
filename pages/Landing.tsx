import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { 
    CheckCircle, ArrowRight, HelpCircle, X, Mail, ChevronLeft, ChevronRight, BookOpen, 
    Clock, Users, Award, Laptop, Target, Lightbulb, Wrench, BrainCircuit, Briefcase, 
    MessageCircle, Star, Gift, Accessibility, Info, MonitorPlay 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Course } from '../types';

// Mapeamento de Configuração para Exibição dos Detalhes
const COURSE_DETAILS_MAP: Record<string, { label: string, icon: any, fullWidth?: boolean, isHtml?: boolean }> = {
    // Estruturais
    target_audience: { label: 'Público-alvo', icon: Users },
    workload: { label: 'Carga Horária', icon: Clock },
    modality: { label: 'Modalidade', icon: Laptop },
    certification: { label: 'Certificação', icon: Award },
    
    // Conteúdo
    objectives: { label: 'Objetivos de Aprendizagem', icon: Target, fullWidth: true },
    program: { label: 'Conteúdo Programático', icon: BookOpen, fullWidth: true, isHtml: true },
    methodology: { label: 'Metodologia de Ensino', icon: Lightbulb, fullWidth: true },
    
    // BI
    tools: { label: 'Ferramentas & Stack', icon: Wrench },
    skills: { label: 'Competências Técnicas', icon: BrainCircuit },
    practical_cases: { label: 'Projetos Práticos', icon: Briefcase },
    
    // Suporte
    support: { label: 'Suporte ao Aluno', icon: MessageCircle },
    testimonials: { label: 'O que dizem os alunos', icon: Star, fullWidth: true, isHtml: true },
    bonus: { label: 'Bónus & Extras', icon: Gift },
    accessibility: { label: 'Acessibilidade', icon: Accessibility },
};

export const Landing: React.FC = () => {
  // Estado para Conteúdo Dinâmico
  const [content, setContent] = useState({
      heroTitle: 'Formação profissional simples e eficaz.',
      heroSubtitle: 'Plataforma integrada para gestão de cursos, alunos e formadores. Interface moderna, rápida e focada na experiência de aprendizagem.',
      ctaPrimary: 'Começar Agora'
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
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('EduTech PT');
  
  // Estado para Visualização de Curso
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Estados do Formulário de Ajuda
  const [formData, setFormData] = useState({ name: '', email: '', message: '', subject: '' });

  // Estado para Cursos Reais
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);

  // Referência para o Carrossel
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar dados
  useEffect(() => {
    if (isSupabaseConfigured) {
        // 1. Carregar Configurações
        supabase.from('system_integrations')
            .select('key, value')
            .in('key', ['landing_page_content', 'help_form_config', 'site_branding'])
            .then(({ data, error }) => {
                if (!error && data) {
                    data.forEach((item: any) => {
                        if (item.key === 'landing_page_content') setContent(prev => ({ ...prev, ...item.value }));
                        if (item.key === 'help_form_config') setHelpConfig(prev => ({ ...prev, ...item.value }));
                        if (item.key === 'site_branding') {
                             if(item.value?.logoUrl) setLogoUrl(item.value.logoUrl);
                             if(item.value?.siteName) setSiteName(item.value.siteName);
                        }
                    });
                }
            });

        // 2. Carregar Cursos Publicados
        supabase.from('courses')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error && data && data.length > 0) {
                    setPublishedCourses(data);
                }
            });
    }
  }, []);

  const handleHelpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const subject = `${helpConfig.subjectPrefix} ${formData.subject}`;
      const body = `Nome: ${formData.name}\nEmail: ${formData.email}\n\nMensagem:\n${formData.message}`;
      const mailtoLink = `mailto:${helpConfig.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      setIsHelpModalOpen(false);
      setFormData({ name: '', email: '', message: '', subject: '' });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -400 : 400;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const stripHtml = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || "";
  };

  // Helper para renderizar secções do curso
  const renderCourseDetail = (key: string, data: { value: string, visible: boolean }) => {
      if (!data.visible || !data.value) return null;
      
      const config = COURSE_DETAILS_MAP[key];
      if (!config) return null; // Campo desconhecido

      const Icon = config.icon || Info;

      return (
          <div key={key} className={`bg-white/60 rounded-xl p-5 border border-white/80 shadow-sm hover:shadow-md transition-shadow ${config.fullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}>
              <div className="flex items-center gap-2 mb-3 text-indigo-700">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Icon size={20} />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-wider">{config.label}</h4>
              </div>
              
              {config.isHtml ? (
                   <div 
                      className="text-slate-600 text-sm leading-relaxed prose prose-sm prose-indigo max-w-none"
                      dangerouslySetInnerHTML={{ __html: data.value }}
                   />
              ) : (
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {data.value}
                  </p>
              )}
          </div>
      );
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
           {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
           ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">E</div>
           )}
           <span className="text-xl font-bold text-slate-800 tracking-tight">{siteName}</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
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
        
        <div 
            className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed prose prose-slate prose-lg"
            dangerouslySetInnerHTML={{ __html: content.heroSubtitle }}
        />
        
        <div className="flex justify-center">
          <Link to="/login" className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            {content.ctaPrimary} <ArrowRight size={20} />
          </Link>
        </div>
      </header>

      {/* Course Showcase */}
      <section className="px-4 py-20 mt-[50px] max-w-[90rem] mx-auto w-full relative z-10">
        <div className="flex justify-between items-end mb-10 max-w-7xl mx-auto px-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Cursos em Destaque</h2>
            <p className="text-slate-500 mt-2">Explore as formações mais procuradas.</p>
          </div>
          {publishedCourses.length > 0 && (
            <div className="flex gap-2">
                <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white/50 hover:bg-white text-slate-600 transition-all border border-slate-200">
                    <ChevronLeft size={24} />
                </button>
                <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white/50 hover:bg-white text-slate-600 transition-all border border-slate-200">
                    <ChevronRight size={24} />
                </button>
            </div>
          )}
        </div>

        {publishedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white/30 rounded-3xl border border-white/50 backdrop-blur-sm max-w-7xl mx-auto text-slate-500">
                <BookOpen size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">Novas formações serão disponibilizadas brevemente.</p>
                <p className="text-sm opacity-70">Fique atento às novidades.</p>
            </div>
        ) : (
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory scroll-smooth px-4 md:px-8 no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
            >
            <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>
            
            {publishedCourses.map((course, idx) => (
                <div key={course.id || idx} className="min-w-[85vw] md:min-w-[380px] snap-center">
                    <div 
                        onClick={() => setSelectedCourse(course)}
                        className="cursor-pointer h-full"
                    >
                        <GlassCard className="group hover:-translate-y-2 transition-transform duration-300 h-full flex flex-col hover:bg-white/60">
                            <div className="h-48 rounded-xl bg-slate-200 mb-6 overflow-hidden relative shrink-0">
                                <img 
                                src={course.cover_image || `https://picsum.photos/400/300?random=${idx}`} 
                                alt={course.title}
                                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-md rounded-md text-xs font-bold text-indigo-700 shadow-sm">
                                Formação
                                </div>
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white/90 text-slate-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg">Ver Detalhes</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{course.title}</h3>
                            <p className="text-slate-500 mb-4 flex-1 line-clamp-3">
                                {stripHtml(course.description || '')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-auto pt-4 border-t border-slate-100">
                                <CheckCircle size={16} className="text-emerald-500" /> Certificado Incluído
                            </div>
                        </GlassCard>
                    </div>
                </div>
            ))}
            </div>
        )}
        
        {publishedCourses.length > 0 && (
            <div className="text-center mt-6">
                <Link to="/login" className="text-indigo-600 font-bold hover:underline text-sm inline-flex items-center gap-1">
                    Ver todos os cursos disponíveis <ArrowRight size={14}/>
                </Link>
            </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-lg border-t border-white/40 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="mb-2">&copy; {new Date().getFullYear()} EduTech PT. Todos os direitos reservados.</p>
          <p>Design Glassmorphism Moderno • Stack React & Supabase</p>
        </div>
      </footer>

      {/* MODAL DETALHES DO CURSO (NOVO) */}
      {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="w-full max-w-5xl h-[90vh] glass-panel bg-white/95 rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
                  {/* Close Button */}
                  <button 
                      onClick={() => setSelectedCourse(null)}
                      className="absolute top-4 right-4 z-20 p-2 bg-white/80 rounded-full hover:bg-white text-slate-500 hover:text-red-500 transition-all shadow-sm"
                  >
                      <X size={24} />
                  </button>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                      
                      {/* Hero Image */}
                      <div className="relative h-64 md:h-80 w-full bg-slate-200">
                          <img 
                              src={selectedCourse.cover_image || 'https://picsum.photos/1200/600'} 
                              className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-8">
                              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg mb-3 w-fit">
                                  Curso Profissional
                              </span>
                              <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 shadow-sm leading-tight">
                                  {selectedCourse.title}
                              </h2>
                          </div>
                      </div>

                      <div className="p-6 md:p-10 space-y-10">
                          
                          {/* Descrição Principal */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              <div className="lg:col-span-2">
                                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                      <MonitorPlay className="text-indigo-600" /> Sobre o Curso
                                  </h3>
                                  <div 
                                      className="prose prose-lg text-slate-600 max-w-none leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: selectedCourse.description }}
                                  />
                              </div>
                              
                              {/* Sidebar CTA Sticky? Not really needed inside modal, but good for summary */}
                              <div className="lg:col-span-1">
                                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 sticky top-4">
                                      <h4 className="font-bold text-indigo-900 mb-4">Resumo Rápido</h4>
                                      <ul className="space-y-3 text-sm text-slate-600 mb-6">
                                          {selectedCourse.details?.workload?.visible && (
                                              <li className="flex items-start gap-2"><Clock size={16} className="text-indigo-500 mt-0.5" /> {selectedCourse.details.workload.value}</li>
                                          )}
                                          {selectedCourse.details?.modality?.visible && (
                                              <li className="flex items-start gap-2"><Laptop size={16} className="text-indigo-500 mt-0.5" /> {selectedCourse.details.modality.value}</li>
                                          )}
                                          {selectedCourse.details?.certification?.visible && (
                                              <li className="flex items-start gap-2"><Award size={16} className="text-indigo-500 mt-0.5" /> Certificação Incluída</li>
                                          )}
                                          <li className="flex items-start gap-2"><CheckCircle size={16} className="text-emerald-500 mt-0.5" /> Acesso Imediato</li>
                                      </ul>
                                      <Link 
                                          to="/login"
                                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
                                      >
                                          Inscrever-se Agora <ArrowRight size={18} />
                                      </Link>
                                      <p className="text-xs text-center text-slate-400 mt-3">Login necessário para inscrição</p>
                                  </div>
                              </div>
                          </div>

                          <hr className="border-slate-200" />

                          {/* Grid Dinâmico de Detalhes */}
                          {selectedCourse.details && Object.keys(selectedCourse.details).length > 0 && (
                              <div>
                                  <h3 className="text-xl font-bold text-slate-800 mb-6">Detalhes da Formação</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {Object.keys(COURSE_DETAILS_MAP).map(key => 
                                          renderCourseDetail(key, selectedCourse.details![key] || { value: '', visible: false })
                                      )}
                                  </div>
                              </div>
                          )}
                          
                          {/* Footer Area */}
                          <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                              <div>
                                  <h4 className="text-white text-xl font-bold mb-1">Pronto para começar?</h4>
                                  <p className="text-sm opacity-80">Junte-se a centenas de alunos e evolua a sua carreira.</p>
                              </div>
                              <Link 
                                  to="/login"
                                  className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                              >
                                  Aceder à Plataforma
                              </Link>
                          </div>

                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL AJUDA (MANTIDO) */}
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