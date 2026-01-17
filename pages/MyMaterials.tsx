import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { GlassCard } from '../components/GlassCard';
import { FileText, Video, Link as LinkIcon, Download, Search, BookOpen, Clock, Loader2, FolderOpen } from 'lucide-react';
import { Material } from '../types';

export const MyMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
      if (!isSupabaseConfigured) return;
      setLoading(true);
      try {
          // Fetch Public Materials or Enrolled Materials
          // Nota: Como o sistema de matriculas é novo, vamos buscar TUDO por enquanto para demonstração,
          // ou filtrar apenas se houver enrollments. Para evitar ecrã vazio, buscamos tudo.
          const { data, error } = await supabase
              .from('course_materials')
              .select(`
                  *,
                  courses (title)
              `)
              .order('created_at', { ascending: false });
            
          if (error) throw error;
          setMaterials(data || []);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'pdf': return <FileText size={20} className="text-red-500" />;
          case 'video': return <Video size={20} className="text-blue-500" />;
          case 'link': return <LinkIcon size={20} className="text-emerald-500" />;
          default: return <FolderOpen size={20} className="text-amber-500" />;
      }
  };

  const filtered = materials.filter(m => filter === 'all' || m.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meus Materiais</h1>
          <p className="text-slate-500 mt-1">Recursos didáticos, documentos e links dos seus cursos.</p>
        </div>
        
        <div className="flex gap-2 bg-white/50 p-1 rounded-xl border border-white/60">
            {['all', 'pdf', 'video', 'link'].map(type => (
                <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                        ${filter === type ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}
                    `}
                >
                    {type === 'all' ? 'Todos' : type}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
          <GlassCard className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FolderOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Sem materiais disponíveis</h3>
              <p className="text-slate-500 text-sm mt-1">Os materiais dos seus cursos aparecerão aqui.</p>
          </GlassCard>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(material => (
                  <GlassCard key={material.id} className="group hover:bg-white/60 transition-colors flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                              {getIcon(material.type)}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                              {material.type}
                          </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 mb-1 line-clamp-2">{material.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-4">
                          <BookOpen size={12} />
                          <span className="truncate max-w-[200px]">{material.courses?.title || 'Geral'}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100">
                          <a 
                              href={material.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                             {material.type === 'link' || material.type === 'video' ? 'Abrir Link' : 'Download'} 
                             {material.type === 'link' || material.type === 'video' ? <LinkIcon size={14}/> : <Download size={14}/>}
                          </a>
                      </div>
                  </GlassCard>
              ))}
          </div>
      )}
    </div>
  );
};