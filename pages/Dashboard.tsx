import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from './Profile';
import { 
  BarChart, Activity, Users, BookOpen, AlertTriangle, 
  Database, Mail, Code, Sparkles, Save, Link, Unlink, Eye, EyeOff, FileText
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../services/supabase';

// --- SUB-COMPONENTES DE PÁGINA ---

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
            v1.2.7
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
-- ADMIN: edutechpt@hotmail.com

-- Tabela Profiles: public.profiles
-- Tabela Integrações: public.system_integrations
`}
        </div>
        <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Executar Query</button>
            <button className="px-4 py-2 bg-white/50 text-slate-700 rounded-lg text-sm hover:bg-white">Backup Schema</button>
        </div>
    </GlassCard>
);

// --- COMPONENTE DE DEFINIÇÕES (INTEGRAÇÕES) ---
const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Estado local para inputs
  const [sbConfig, setSbConfig] = useState({
    url: localStorage.getItem('edutech_sb_url') || '',
    key: localStorage.getItem('edutech_sb_key') || ''
  });

  const [integrations, setIntegrations] = useState({
    emailjs: { serviceId: '', templateId: '', publicKey: '' },
    google: { scriptUrl: '' },
    gemini: { apiKey: '' },
  });

  // Estado para textos personalizados
  const [resizeInstructions, setResizeInstructions] = useState('Aceda ao site, faça upload da sua foto, defina 300x300px e faça o download da nova imagem.');

  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  // Carregar integrações do Supabase (apenas se conectado)
  useEffect(() => {
    if (isSupabaseConfigured && user) {
      const fetchIntegrations = async () => {
        const { data, error } = await supabase.from('system_integrations').select('*');
        if (!error && data) {
          const newIntegrations = { ...integrations };
          data.forEach((item: any) => {
            if (item.key === 'emailjs') newIntegrations.emailjs = item.value;
            if (item.key === 'google_scripts') newIntegrations.google = item.value;
            if (item.key === 'gemini') newIntegrations.gemini = item.value;
            // Carregar texto personalizado
            if (item.key === 'resize_pixel_instructions') setResizeInstructions(item.value.text);
          });
          setIntegrations(newIntegrations);
        }
      };
      fetchIntegrations();
    }
  }, [isSupabaseConfigured, user]);

  const handleSbSave = () => {
    if (sbConfig.url && sbConfig.key) {
      localStorage.setItem('edutech_sb_url', sbConfig.url);
      localStorage.setItem('edutech_sb_key', sbConfig.key);
      window.location.reload(); // Recarregar para aplicar nova config
    }
  };

  const handleSbClear = () => {
    localStorage.removeItem('edutech_sb_url');
    localStorage.removeItem('edutech_sb_key');
    window.location.reload();
  };

  const saveIntegration = async (key: string, value: any) => {
    if (!isSupabaseConfigured) {
      alert("Conecte o Supabase primeiro para salvar esta integração na nuvem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('system_integrations').upsert({
        key,
        value,
        updated_by: user?.id
      });
      if (error) throw error;
      alert("Configuração salva com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field: string) => {
    setShowKey(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Definições & Integrações</h1>
          <p className="text-slate-500 mt-1">Gerir conexões com serviços externos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* 1. SUPABASE CONFIG */}
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <Database size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">Supabase (Base de Dados)</h3>
              <p className="text-xs text-slate-500">Core do sistema. Necessário para persistência.</p>
            </div>
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                <Link size={12} /> Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
                <Unlink size={12} /> Local
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Project URL</label>
              <input 
                type="text" 
                value={sbConfig.url}
                onChange={e => setSbConfig({...sbConfig, url: e.target.value})}
                placeholder="https://seu-projeto.supabase.co"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Anon / Public Key</label>
              <div className="relative">
                <input 
                  type={showKey['sb'] ? "text" : "password"}
                  value={sbConfig.key}
                  onChange={e => setSbConfig({...sbConfig, key: e.target.value})}
                  placeholder="eyJh..."
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                />
                <button 
                  onClick={() => toggleShow('sb')}
                  className="absolute right-2 top-1/2 translate-y-[-20%] text-slate-400 hover:text-slate-600"
                >
                  {showKey['sb'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSbSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Save size={16} /> Salvar e Conectar
              </button>
              {isSupabaseConfigured && (
                 <button onClick={handleSbClear} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors">
                   Desconectar
                 </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* 2. PERSONALIZAÇÃO DE TEXTOS */}
        <GlassCard>
           <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-pink-100 text-pink-600">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Personalização de Textos</h3>
              <p className="text-xs text-slate-500">Edite mensagens e instruções do sistema.</p>
            </div>
          </div>
          <div className="space-y-3">
             <div>
               <label className="text-xs font-semibold text-slate-600">Instruções de Redimensionamento (Perfil)</label>
               <textarea 
                  value={resizeInstructions}
                  onChange={e => setResizeInstructions(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm resize-none focus:ring-2 focus:ring-pink-500 outline-none"
               />
             </div>
             <button 
               onClick={() => saveIntegration('resize_pixel_instructions', { text: resizeInstructions })}
               disabled={loading || !isSupabaseConfigured}
               className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <Save size={16} /> Salvar Texto
             </button>
          </div>
        </GlassCard>

        {/* 3. EMAILJS CONFIG */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">EmailJS</h3>
              <p className="text-xs text-slate-500">Automação de emails transacionais.</p>
            </div>
          </div>
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Service ID</label>
                  <input 
                    type="text" 
                    value={integrations.emailjs.serviceId}
                    onChange={e => setIntegrations({...integrations, emailjs: {...integrations.emailjs, serviceId: e.target.value}})}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Template ID</label>
                  <input 
                    type="text" 
                    value={integrations.emailjs.templateId}
                    onChange={e => setIntegrations({...integrations, emailjs: {...integrations.emailjs, templateId: e.target.value}})}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm"
                  />
                </div>
             </div>
             <div>
               <label className="text-xs font-semibold text-slate-600">Public Key</label>
               <input 
                  type="password" 
                  value={integrations.emailjs.publicKey}
                  onChange={e => setIntegrations({...integrations, emailjs: {...integrations.emailjs, publicKey: e.target.value}})}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm"
               />
             </div>
             <button 
               onClick={() => saveIntegration('emailjs', integrations.emailjs)}
               disabled={loading || !isSupabaseConfigured}
               className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Configuração'}
             </button>
          </div>
        </GlassCard>

        {/* 4. GOOGLE APPS SCRIPT */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Code size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Google Apps Script</h3>
              <p className="text-xs text-slate-500">Webhooks para Sheets/Drive/Docs.</p>
            </div>
          </div>
          <div className="space-y-3">
             <div>
               <label className="text-xs font-semibold text-slate-600">Web App URL (Deployment)</label>
               <input 
                  type="text" 
                  value={integrations.google.scriptUrl}
                  onChange={e => setIntegrations({...integrations, google: {...integrations.google, scriptUrl: e.target.value}})}
                  placeholder="https://script.google.com/macros/s/..."
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm"
               />
             </div>
             <button 
               onClick={() => saveIntegration('google_scripts', integrations.google)}
               disabled={loading || !isSupabaseConfigured}
               className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <Save size={16} /> Salvar Integração
             </button>
          </div>
        </GlassCard>

        {/* 5. GEMINI AI */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Google Gemini AI</h3>
              <p className="text-xs text-slate-500">Inteligência Artificial Generativa.</p>
            </div>
          </div>
          <div className="space-y-3">
             <div>
               <label className="text-xs font-semibold text-slate-600">API Key</label>
               <div className="relative">
                 <input 
                    type={showKey['gemini'] ? "text" : "password"}
                    value={integrations.gemini.apiKey}
                    onChange={e => setIntegrations({...integrations, gemini: {...integrations.gemini, apiKey: e.target.value}})}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm pr-10"
                 />
                 <button 
                  onClick={() => toggleShow('gemini')}
                  className="absolute right-2 top-1/2 translate-y-[-20%] text-slate-400 hover:text-slate-600"
                >
                  {showKey['gemini'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
               </div>
             </div>
             <button 
               onClick={() => saveIntegration('gemini', integrations.gemini)}
               disabled={loading || !isSupabaseConfigured}
               className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <Save size={16} /> Salvar Chave API
             </button>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#eef2f6] relative flex">
        {/* Background Gradients for Glassmorphism */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-[100px]"></div>
        </div>

        <Sidebar />

        <main className="flex-1 ml-64 p-8 relative z-10 overflow-y-auto h-screen">
            <Routes>
                <Route index element={<DashboardHome />} />
                
                <Route path="users" element={
                    (user.role === 'admin' || user.role === 'editor') 
                    ? <UsersManagement /> 
                    : <Navigate to="/dashboard" replace />
                } />
                
                <Route path="settings" element={
                    user.role === 'admin' 
                    ? <Settings /> 
                    : <Navigate to="/dashboard" replace />
                } />

                <Route path="sql" element={
                    user.role === 'admin' 
                    ? <SQLManagement /> 
                    : <Navigate to="/dashboard" replace />
                } />

                <Route path="profile" element={<Profile />} />

                {/* Placeholders for other routes mentioned in sidebar */}
                <Route path="courses" element={<GlassCard title="Gestão de Cursos"><p className="text-slate-500">Módulo de cursos em desenvolvimento.</p></GlassCard>} />
                <Route path="permissions" element={<GlassCard title="Permissões"><p className="text-slate-500">Gestão de permissões em desenvolvimento.</p></GlassCard>} />
                <Route path="materials" element={<GlassCard title="Meus Materiais"><p className="text-slate-500">Área do aluno em desenvolvimento.</p></GlassCard>} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </main>
    </div>
  );
};