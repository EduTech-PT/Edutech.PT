import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { Code, ExternalLink, Image as ImageIcon, Database } from 'lucide-react';

export const IntegrationsManager: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
          <h1 className="text-3xl font-bold text-slate-800">Integrações</h1>
          <p className="text-slate-500 mt-1">Conecte ferramentas externas e configure serviços.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
};