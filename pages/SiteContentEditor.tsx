import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { GlassCard } from '../components/GlassCard';
import { Save, Loader2, Layout, Type, Palette, MessageSquare, Image as ImageIcon, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export const SiteContentEditor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'branding' | 'help'>('hero');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados dos Formulários
  const [heroContent, setHeroContent] = useState({
      heroTitle: 'Formação profissional simples e eficaz.',
      heroSubtitle: 'Plataforma integrada...',
      ctaPrimary: 'Começar Agora'
  });

  const [branding, setBranding] = useState({
      logoUrl: '',
      siteName: 'EduTech PT',
      faviconUrl: ''
  });

  const [helpConfig, setHelpConfig] = useState({
      buttonText: 'Dúvidas / Ajuda',
      modalTitle: 'Como podemos ajudar?',
      adminEmail: 'edutechpt@hotmail.com',
      subjectPrefix: '[EduTech] Dúvida:',
      helperText: 'Preencha os campos abaixo...'
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchConfig = async () => {
      if (!isSupabaseConfigured) return;
      setLoading(true);
      try {
          const { data } = await supabase.from('system_integrations')
            .select('key, value')
            .in('key', ['landing_page_content', 'site_branding', 'help_form_config']);

          if (data) {
              data.forEach((item: any) => {
                  if (item.key === 'landing_page_content') setHeroContent(prev => ({ ...prev, ...item.value }));
                  if (item.key === 'site_branding') setBranding(prev => ({ ...prev, ...item.value }));
                  if (item.key === 'help_form_config') setHelpConfig(prev => ({ ...prev, ...item.value }));
              });
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleSave = async () => {
      setSaving(true);
      try {
          // Guardar Branding
          await supabase.from('system_integrations').upsert({
              key: 'site_branding',
              value: branding,
              updated_at: new Date()
          });

          // Guardar Hero
          await supabase.from('system_integrations').upsert({
              key: 'landing_page_content',
              value: heroContent,
              updated_at: new Date()
          });

          // Guardar Help
          await supabase.from('system_integrations').upsert({
              key: 'help_form_config',
              value: helpConfig,
              updated_at: new Date()
          });

          setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
          
          // Force branding reload if possible without full reload, but usually full reload is safer for siteName/favicon
          // window.location.reload(); 
      } catch (err: any) {
          setMessage({ type: 'error', text: 'Erro ao guardar: ' + err.message });
      } finally {
          setSaving(false);
      }
  };

  const renderTabButton = (id: typeof activeTab, label: string, Icon: any) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
            ${activeTab === id 
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/40'}
        `}
      >
          <Icon size={16} />
          {label}
      </button>
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Editor de Site</h1>
                <p className="text-slate-500 mt-1">Personalize a Landing Page e identidade visual.</p>
            </div>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
                Guardar Alterações
            </button>
        </div>

        {message && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
            }`}>
            <CheckCircle2 size={20} />
            <span className="font-medium">{message.text}</span>
            </div>
        )}

        <div className="flex overflow-x-auto border-b border-slate-200 bg-white/30 rounded-t-xl mx-1">
            {renderTabButton('hero', 'Landing Page & Hero', Layout)}
            {renderTabButton('branding', 'Marca & Identidade', Palette)}
            {renderTabButton('help', 'Formulário de Ajuda', MessageSquare)}
        </div>

        {/* TAB HERO */}
        {activeTab === 'hero' && (
            <GlassCard className="animate-in fade-in duration-300">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Título Principal (H1)</label>
                        <input 
                            type="text"
                            value={heroContent.heroTitle}
                            onChange={e => setHeroContent({...heroContent, heroTitle: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Subtítulo / Descrição</label>
                        <textarea 
                            value={heroContent.heroSubtitle}
                            onChange={e => setHeroContent({...heroContent, heroSubtitle: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Botão de Ação (CTA)</label>
                        <input 
                            type="text"
                            value={heroContent.ctaPrimary}
                            onChange={e => setHeroContent({...heroContent, ctaPrimary: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </GlassCard>
        )}

        {/* TAB BRANDING */}
        {activeTab === 'branding' && (
            <GlassCard className="animate-in fade-in duration-300">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Nome do Site</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                value={branding.siteName}
                                onChange={e => setBranding({...branding, siteName: e.target.value})}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">URL do Logótipo (PNG/SVG)</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                value={branding.logoUrl}
                                onChange={e => setBranding({...branding, logoUrl: e.target.value})}
                                placeholder="https://..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {branding.logoUrl && (
                            <div className="mt-2 p-2 bg-slate-100 rounded-lg inline-block border border-slate-200">
                                <img src={branding.logoUrl} className="h-8 object-contain" alt="Preview" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">URL do Favicon</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                value={branding.faviconUrl}
                                onChange={e => setBranding({...branding, faviconUrl: e.target.value})}
                                placeholder="https://..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </GlassCard>
        )}

        {/* TAB HELP */}
        {activeTab === 'help' && (
             <GlassCard className="animate-in fade-in duration-300">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Email de Receção</label>
                        <input 
                            type="email"
                            value={helpConfig.adminEmail}
                            onChange={e => setHelpConfig({...helpConfig, adminEmail: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Texto do Botão</label>
                            <input 
                                type="text"
                                value={helpConfig.buttonText}
                                onChange={e => setHelpConfig({...helpConfig, buttonText: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Título do Modal</label>
                            <input 
                                type="text"
                                value={helpConfig.modalTitle}
                                onChange={e => setHelpConfig({...helpConfig, modalTitle: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Prefixo do Assunto</label>
                        <input 
                            type="text"
                            value={helpConfig.subjectPrefix}
                            onChange={e => setHelpConfig({...helpConfig, subjectPrefix: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Texto de Ajuda</label>
                        <textarea 
                            value={helpConfig.helperText}
                            onChange={e => setHelpConfig({...helpConfig, helperText: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>
             </GlassCard>
        )}
    </div>
  );
};