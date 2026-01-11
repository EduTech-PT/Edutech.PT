
import React from 'react';
import { COURSES } from '../constants';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Alunos Ativos', value: '1,284', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cursos Ativos', value: '12', color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Faturação (Mês)', 'value': '14,250€', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Taxa de Conclusão', value: '89%', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <section className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Painel de Administração</h1>
            <p className="text-slate-500">Gestão centralizada da EduTech PT</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Curso
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-transform hover:scale-[1.02]">
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Courses Management */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Listagem de Cursos</h3>
            <div className="flex gap-2">
              <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-medium">Todos</span>
              <span className="text-slate-400 text-xs px-3 py-1 rounded-full font-medium cursor-pointer hover:bg-slate-50">Publicados</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Curso</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Duração</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COURSES.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={course.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <span className="font-bold text-slate-700">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{course.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{course.duration}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 p-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="text-slate-400 hover:text-red-600 p-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
