
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-20 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-blue-700 text-xs font-bold uppercase tracking-wider">Inscrições abertas para 2024</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
          Domine o Futuro com a <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">EduTech PT</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          A plataforma de educação tecnológica líder em Portugal. Aprenda com os melhores especialistas e conte com suporte de IA 24/7.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all active:scale-95">
            Explorar Cursos
          </button>
          <button className="w-full sm:w-auto bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-bold py-4 px-8 rounded-2xl shadow-sm transition-all hover:shadow-md">
            Ver Demonstração
          </button>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900">15k+</span>
            <span className="text-sm">Alunos Ativos</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900">50+</span>
            <span className="text-sm">Cursos Premium</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900">98%</span>
            <span className="text-sm">Satisfação</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900">24/7</span>
            <span className="text-sm">Suporte IA</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
