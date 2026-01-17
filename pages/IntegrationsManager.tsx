import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Code, ExternalLink, Image as ImageIcon, Database, Mail, Copy, CheckCircle2, AlertTriangle, Shield, Save, Loader2, Key, Link as LinkIcon, Clock, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const IntegrationsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'api'>('general');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de Configuração
  const [authConfig, setAuthConfig] = useState({
      resendTimerSeconds: 60,
  });

  const [webhookConfig, setWebhookConfig] = useState({
      activepiecesUrl: '',
      zapierUrl: ''
  });

  // Estados de Configuração Manual do Supabase
  const [manualSupabase, setManualSupabase] = useState({
      url: localStorage.getItem('edutech_sb_url') || '',
      key: localStorage.getItem('edutech_sb_key') || ''
  });

  // Carregar Configurações
  useEffect(() => {
    if (isSupabaseConfigured) {
        setLoading(true);
        supabase.from('system_integrations').select('key, value')
        .in('key', ['auth_config', 'webhook_config'])
        .then(({ data }) => {
            if (data) {
                data.forEach((item: any) => {
                    if (item.key === 'auth_config') setAuthConfig(prev => ({ ...prev, ...item.value }));
                    if (item.key === 'webhook_config') setWebhookConfig(prev => ({ ...prev, ...item.value }));
                });
            }
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, []);

  const handleSaveApi = async () => {
      setSaving(true);
      try {
          // Guardar Auth Config
          if (isSupabaseConfigured) {
              await supabase.from('system_integrations').upsert({
                  key: 'auth_config',
                  value: authConfig,
                  updated_at: new Date()
              });

              // Guardar Webhook Config
              await supabase.from('system_integrations').upsert({
                  key: 'webhook_config',
                  value: webhookConfig,
                  updated_at: new Date()
              });
          }

          // Guardar Configuração Manual do Supabase (LocalStorage)
          if (manualSupabase.url && manualSupabase.key) {
              localStorage.setItem('edutech_sb_url', manualSupabase.url);
              localStorage.setItem('edutech_sb_key', manualSupabase.key);
          } else {
              // Se limpar, removemos
              if (!manualSupabase.url && !manualSupabase.key) {
                  localStorage.removeItem('edutech_sb_url');
                  localStorage.removeItem('edutech_sb_key');
              }
          }

          alert("Configurações atualizadas com sucesso!");
          // Se as chaves mudaram, pode ser necessário reload
          if (manualSupabase.url && manualSupabase.url !== process.env.REACT_APP_SUPABASE_URL) {
              if (confirm("Alterou as chaves de conexão. Deseja recarregar a página para aplicar?")) {
                  window.location.reload();
              }
          }

      } catch (err: any) {
          alert("Erro ao guardar: " + err.message);
      } finally {
          setSaving(false);
      }
  };

  const emailTemplateCode = `<h2>Olá!</h2>
<p>Para aceder à plataforma <strong>EduTech PT</strong>, utilize o seguinte código de verificação:</p>
<div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5;">{{ .Token }}</span>
</div>
<p>Este código é válido por 15 minutos.</p>
<p style="color: #6b7280; font-size: 12px;">Se não solicitou este acesso, pode ignorar este email.</p>`;

  const handleCopy = () => {
      navigator.clipboard.writeText(emailTemplateCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Integrações & Configurações</h1>
            <p className="text-slate-500 mt-1">Conecte ferramentas e configure o comportamento do sistema.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Conexões Gerais
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 ${activeTab === 'api' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              APIs & Segurança
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 ${activeTab === 'email' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Templates de Email
          </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <GlassCard title="Supabase (Base de Dados)">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                        <Database size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800">Conexão Ativa</h4>
                        <p className="text-sm text-slate-500 mt-1">A plataforma está conectada ao projeto Supabase.</p>
                        <a 
                            href="https://supabase.com/dashboard" 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                        >
                            Aceder Dashboard <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </GlassCard>

            <GlassCard title="Ferramentas de Imagem">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                        <ImageIcon size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800">ResizePixel</h4>
                        <p className="text-sm text-slate-500 mt-1">Ferramenta recomendada para redimensionar avatares e capas.</p>
                        <a 
                            href="https://www.resizepixel.com/pt/" 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                        >
                            Abrir Ferramenta <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </GlassCard>
        </div>
      )}

      {activeTab === 'api' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-end">
                   <button 
                      onClick={handleSaveApi}
                      disabled={saving || loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                      {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                      Guardar Configurações
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard title="Configuração Manual (Supabase)">
                       <div className="space-y-4">
                           <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-3 text-xs text-slate-600">
                               <Key className="shrink-0 text-slate-500" size={16} />
                               <p>Insira aqui as chaves do seu projeto se as variáveis de ambiente falharem. (Guardado no Browser)</p>
                           </div>

                           <div>
                               <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Project URL</label>
                               <input 
                                   type="text" 
                                   value={manualSupabase.url}
                                   onChange={e => setManualSupabase({...manualSupabase, url: e.target.value})}
                                   placeholder="https://xyz.supabase.co"
                                   className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-mono text-xs"
                               />
                           </div>
                           <div>
                               <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Anon Key (Public)</label>
                               <input 
                                   type="password" 
                                   value={manualSupabase.key}
                                   onChange={e => setManualSupabase({...manualSupabase, key: e.target.value})}
                                   placeholder="eyJh..."
                                   className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-mono text-xs"
                               />
                           </div>
                       </div>
                  </GlassCard>

                  <GlassCard title="Segurança & Limites">
                      <div className="space-y-4">
                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3 text-xs text-indigo-800">
                             <Shield className="shrink-0 text-indigo-600" size={16} />
                             <p>
                                 <strong>Nota Importante:</strong> O Supabase tem um limite fixo de 3 emails/hora no plano gratuito. 
                                 Este campo controla apenas o contador visual do site.
                             </p>
                          </div>
                          
                          <div>
                              <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Tempo de Espera Visual (Countdown)</label>
                              <div className="relative">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                      type="number" 
                                      min="0"
                                      value={authConfig.resendTimerSeconds}
                                      onChange={e => setAuthConfig({...authConfig, resendTimerSeconds: parseInt(e.target.value)})}
                                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">segundos</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">Coloque a 0 para remover o temporizador visual (não remove o bloqueio do servidor).</p>
                          </div>
                      </div>
                  </GlassCard>

                  <GlassCard title="Webhooks & Automação">
                      <div className="space-y-4">
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-xs text-amber-800">
                             <Code className="shrink-0 text-amber-600" size={16} />
                             <p>Insira aqui os Webhooks para disparar automações externas (ex: Activepieces, Zapier) quando um novo utilizador se regista.</p>
                          </div>

                          <div>
                              <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Webhook Activepieces (Novo User)</label>
                              <div className="relative">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                      type="text" 
                                      value={webhookConfig.activepiecesUrl}
                                      onChange={e => setWebhookConfig({...webhookConfig, activepiecesUrl: e.target.value})}
                                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                      placeholder="https://cloud.activepieces.com/api/v1/webhooks/..."
                                  />
                              </div>
                          </div>

                          <div>
                              <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Outras APIs (Zapier/Make)</label>
                              <div className="relative">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                      type="text" 
                                      value={webhookConfig.zapierUrl}
                                      onChange={e => setWebhookConfig({...webhookConfig, zapierUrl: e.target.value})}
                                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                      placeholder="https://hooks.zapier.com/..."
                                  />
                              </div>
                          </div>
                      </div>
                  </GlassCard>
              </div>
          </div>
      )}

      {activeTab === 'email' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                      <AlertTriangle size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-amber-900">Configuração Necessária</h4>
                      <p className="text-sm text-amber-800 mt-1">
                          Por defeito, o Supabase envia um link (Magic Link). Para que o sistema peça o código de 6 dígitos, 
                          deve alterar o template HTML no painel do Supabase para exibir a variável <code className="bg-amber-100 px-1 rounded font-bold">{'{{ .Token }}'}</code>.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard title="1. Copiar Template HTML">
                      <p className="text-sm text-slate-500 mb-4">
                          Copie este código para usar no seu template de email. Ele é estilizado e mostra o código em destaque.
                      </p>
                      <div className="relative">
                          <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-slate-700">
                              {emailTemplateCode}
                          </pre>
                          <button 
                              onClick={handleCopy}
                              className={`absolute top-2 right-2 p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                          >
                              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                              {copied ? 'Copiado!' : 'Copiar'}
                          </button>
                      </div>
                  </GlassCard>

                  <GlassCard title="2. Aplicar no Supabase">
                       <ol className="list-decimal list-inside space-y-4 text-sm text-slate-600">
                           <li className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                               Aceda ao <a href="https://supabase.com/dashboard/project/_/auth/templates" target="_blank" className="text-indigo-600 font-bold hover:underline">Painel Auth &gt; Email Templates</a>.
                           </li>
                           <li className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                               Selecione o template <strong>"Magic Link"</strong>.
                           </li>
                           <li className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                               No campo "Subject" (Assunto), coloque: <br/>
                               <span className="font-mono text-slate-800 font-bold">O seu código de acesso EduTech</span>
                           </li>
                           <li className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                               No corpo da mensagem, apague tudo e <strong>cole o código HTML</strong> que copiou ao lado.
                           </li>
                           <li className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                               Clique em <strong>Save</strong>.
                           </li>
                       </ol>
                       <div className="mt-4 text-center">
                            <a 
                                href="https://supabase.com/dashboard/project/_/auth/templates" 
                                target="_blank"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                            >
                                <Mail size={18} /> Ir para Templates Supabase
                            </a>
                       </div>
                  </GlassCard>
              </div>
          </div>
      )}
    </div>
  );
};