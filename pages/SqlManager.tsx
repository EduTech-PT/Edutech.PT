import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, REQUIRED_SQL_SCHEMA, CURRENT_SQL_VERSION } from '../services/supabase';
import { GlassCard } from '../components/GlassCard';
import { Database, Copy, Check, ExternalLink, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';

export const SqlManager: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [dbVersion, setDbVersion] = useState<string>('Verificando...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
        setDbVersion('Modo Local (N/A)');
        setLoading(false);
        return;
    }
    
    try {
      const { data, error } = await supabase
        .from('system_integrations')
        .select('value')
        .eq('key', 'sql_version')
        .single();

      if (data?.value?.version) {
        setDbVersion(data.value.version);
      } else {
        setDbVersion('Desconhecida (v0.0.0)');
      }
    } catch (err) {
      setDbVersion('Não detetada');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(REQUIRED_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOutdated = dbVersion !== CURRENT_SQL_VERSION && isSupabaseConfigured;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestão de Base de Dados</h1>
          <p className="text-slate-500 mt-1">Sincronize a estrutura do Supabase com o código da aplicação.</p>
        </div>
        <button 
            onClick={checkVersion}
            className="p-2 text-slate-500 hover:text-indigo-600 bg-white/50 hover:bg-white rounded-lg transition-all"
            title="Verificar Novamente"
        >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard title="Estado da Sincronização">
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">Versão do Código (App)</span>
                      <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{CURRENT_SQL_VERSION}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">Versão da Base de Dados</span>
                      <span className={`text-sm font-mono font-bold px-2 py-1 rounded border ${isOutdated ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {dbVersion}
                      </span>
                  </div>

                  {isOutdated ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800 text-sm animate-in fade-in slide-in-from-top-2">
                          <AlertTriangle className="shrink-0" size={20} />
                          <div>
                              <p className="font-bold">Atualização Necessária</p>
                              <p className="mt-1">A estrutura da base de dados está desatualizada. Copie o código SQL ao lado e execute-o no Supabase para garantir todas as funcionalidades.</p>
                          </div>
                      </div>
                  ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-2">
                          <Check className="shrink-0" size={20} />
                          <div>
                              <p className="font-bold">Tudo Atualizado</p>
                              <p className="mt-1">A sua base de dados está perfeitamente sincronizada.</p>
                          </div>
                      </div>
                  )}
              </div>
          </GlassCard>

          <GlassCard title="Instruções de Execução">
              <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600 marker:text-indigo-500 marker:font-bold">
                  <li className="pl-2">Copie o código SQL clicando no botão <strong>"Copiar Código"</strong> abaixo.</li>
                  <li className="pl-2">Aceda ao <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" className="text-indigo-600 font-bold hover:underline">Supabase Dashboard</a> (link externo).</li>
                  <li className="pl-2">No menu lateral, clique em <strong>SQL Editor</strong>.</li>
                  <li className="pl-2">Cole o código na área de texto e clique em <strong>Run</strong> (Canto inferior direito).</li>
                  <li className="pl-2">Se vir "Success", volte aqui e atualize a página.</li>
              </ol>
              <div className="mt-6 flex gap-3">
                  <a 
                    href="https://supabase.com/dashboard/project/_/sql" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:border-indigo-600 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all"
                  >
                      <ExternalLink size={18} /> Abrir Supabase
                  </a>
              </div>
          </GlassCard>
      </div>

      <GlassCard className="relative overflow-hidden p-0 border border-slate-300 shadow-md">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-700">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Script de Migração SQL</h3>
                    <p className="text-xs text-slate-500">Inclui correções de permissões e estrutura</p>
                  </div>
              </div>
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg ${
                    copied 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                }`}
              >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copiado com Sucesso!' : 'Copiar Código'}
              </button>
          </div>
          <div className="bg-[#1e1e1e] p-6 max-h-[600px] overflow-y-auto custom-scrollbar overflow-x-hidden">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap break-all w-full">
                  {REQUIRED_SQL_SCHEMA}
              </pre>
          </div>
      </GlassCard>
    </div>
  );
};
