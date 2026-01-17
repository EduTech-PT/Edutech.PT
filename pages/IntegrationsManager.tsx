import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Code, ExternalLink, Image as ImageIcon, Database, Mail, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

export const IntegrationsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'email'>('general');
  const [copied, setCopied] = useState(false);

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
            onClick={() => setActiveTab('email')}
            className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 ${activeTab === 'email' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Templates de Email (OTP)
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

            <GlassCard title="Webhook & Automação" className="opacity-75">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                        <Code size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-700">Activepieces / Zapier</h4>
                        <p className="text-sm text-slate-500 mt-1">Configuração de webhooks para novos registos (Brevemente).</p>
                    </div>
                </div>
            </GlassCard>
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
                               Aceda ao <a href="https://supabase.com/dashboard/project/_/auth/templates" target="_blank" className="text-indigo-600 font-bold hover:underline">Painel Auth > Email Templates</a>.
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