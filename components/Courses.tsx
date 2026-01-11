
import React from 'react';
import { COURSES } from '../constants';

const Courses: React.FC = () => {
  return (
    <section id="cursos" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Cursos de Alta Performance</h2>
            <p className="text-slate-600">Formações intensivas para quem quer se destacar no mercado global de tecnologia.</p>
          </div>
          <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 group">
            Ver todos os cursos
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COURSES.map((course) => (
            <div key={course.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-600">
                  {course.category}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3 text-xs font-medium text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path d="M12 6V12L16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {course.duration} de conteúdo
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-6 flex-1">{course.description}</p>
                <button className="w-full py-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold rounded-xl border border-slate-100 hover:border-blue-100 transition-all">
                  Saiba mais
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;
