import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Activity, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Cursos Ativos', value: '12', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Alunos', value: '1,240', icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: 'Taxa de Conclusão', value: '87%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Receita Mensal', value: '€ 12.4k', icon: BarChart, color: 'text-violet-600', bg: 'bg-violet-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Olá, {user?.full_name?.split(' ')[0] || 'Utilizador'}</h1>
          <p className="text-slate-500 mt-1">Aqui está o resumo da sua plataforma hoje.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-slate-500 bg-white/40 px-3 py-1 rounded-lg border border-white/50">
            v1.0.2
            </div>
            {!isSupabaseConfigured && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <AlertTriangle size={12} /> Modo Local (Sem Supabase)
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <GlassCard key={idx} className="flex items-center gap-4 hover:bg-white/50 transition-colors">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-800">{stat.value}</h4>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard title="Atividade Recente">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Novo aluno registado</p>
                  <p className="text-xs text-slate-500">Há 2 horas</p>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <button className="text-sm text-indigo-600 font-medium hover:underline">Ver tudo</button>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="Cursos Populares">
          <div className="space-y-4">
             {/* Placeholder for Data Fetching */}
             <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-sm">
                {isSupabaseConfigured 
                    ? "A aguardar dados reais do Supabase..." 
                    : "⚠️ Conecte o Supabase para ver dados reais."}
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const UsersManagement: React.FC = () => (
  <GlassCard title="Gestão de Utilizadores">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider">
          <tr>
            <th className="pb-3 pl-2">Nome</th>
            <th className="pb-3">Email</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody>
           {/* Row Mock for structure visualization */}
           <tr className="border-b border-white/40 hover:bg-white/30 transition-colors">
             <td className="py-3 pl-2 font-medium text-slate-800">Exemplo Admin</td>
             <td className="py-3">edutechpt@hotmail.com</td>
             <td className="py-3"><span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs font-bold">Admin</span></td>
             <td className="py-3"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>Ativo</td>
           </tr>
        </tbody>
      </table>
      <div className="mt-4 text-xs text-slate-400 text-center">
        Dados servidos via Supabase (auth.users)
      </div>
    </div>
  </GlassCard>
);

const SQLManagement: React.FC = () => (
    <GlassCard title="Gestão SQL & Banco de Dados">
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
            {`-- Status da Conexão
SUPABASE_URL: ${isSupabaseConfigured ? 'Configurado' : 'Não Configurado (Modo Local)'}

-- Tabela Profiles detetada: public.profiles
-- RLS Ativo: Sim
-- Admin Configurado: edutechpt@hotmail.com
`}
        </div>
        <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Executar Query</button>
            <button className="px-4 py-2 bg-white/50 text-slate-700 rounded-lg text-sm hover:bg-white">Backup Schema</button>
        </div>
    </GlassCard>
)

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-fixed">
      {/* Overlay to ensure readability */}
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-0"></div>
      
      <Sidebar />
      
      <main className="relative z-10 pl-64 p-8 transition-all">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/sql" element={<SQLManagement />} />
          <Route path="*" element={<div className="text-slate-500">Módulo em desenvolvimento...</div>} />
        </Routes>
      </main>
    </div>
  );
};