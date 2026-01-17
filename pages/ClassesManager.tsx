import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { GlassCard } from '../components/GlassCard';
import { 
  Plus, Edit2, Trash2, Search, Loader2, Save, X, RefreshCw, GraduationCap, Calendar, BookOpen
} from 'lucide-react';
import { Class, Course } from '../types';

export const ClassesManager: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<Class>>({
      name: '',
      status: 'active',
  });

  useEffect(() => {
      fetchData();
  }, []);

  const fetchData = async () => {
      if (!isSupabaseConfigured) return;
      setLoading(true);
      try {
          // Fetch Classes
          const { data: classData, error: classError } = await supabase
              .from('classes')
              .select('*, courses(title)')
              .order('created_at', { ascending: false });

          if (classError) throw classError;
          setClasses(classData || []);

          // Fetch Courses (for dropdown)
          const { data: courseData } = await supabase
              .from('courses')
              .select('id, title')
              .eq('status', 'published');
          
          setCourses(courseData || []);

      } catch (err: any) {
          console.error("Erro ao carregar dados:", err);
      } finally {
          setLoading(false);
      }
  };

  const handleCreate = () => {
      setEditingClass({
          name: '',
          status: 'active',
          start_date: '',
          end_date: '',
          course_id: ''
      });
      setIsModalOpen(true);
  };

  const handleEdit = (cls: Class) => {
      setEditingClass({
          ...cls,
          course_id: cls.course_id || '' // Handle null
      });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Tem a certeza que deseja eliminar esta turma? Os alunos ficarão sem turma associada.")) return;
      setProcessing(true);
      try {
          const { error } = await supabase.from('classes').delete().eq('id', id);
          if (error) throw error;
          await fetchData();
      } catch (err: any) {
          alert("Erro ao eliminar: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);
      try {
          const payload = {
              name: editingClass.name,
              course_id: editingClass.course_id || null,
              start_date: editingClass.start_date || null,
              end_date: editingClass.end_date || null,
              status: editingClass.status
          };

          if (editingClass.id) {
              const { error } = await supabase.from('classes').update(payload).eq('id', editingClass.id);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('classes').insert([payload]);
              if (error) throw error;
          }
          
          setIsModalOpen(false);
          await fetchData();
      } catch (err: any) {
          alert("Erro ao guardar: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  const filteredClasses = classes.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-slate-800">Gestão de Turmas</h2>
               <button onClick={fetchData} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors" title="Atualizar Lista">
                   <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
               </button>
           </div>
           <p className="text-slate-500 text-sm">Crie turmas e associe-as a cursos.</p>
        </div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
            <Plus size={16} /> Nova Turma
        </button>
      </div>

      <div className="bg-white/40 p-3 rounded-xl border border-white/50 backdrop-blur-sm flex gap-2">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
                type="text" 
                placeholder="Pesquisar turma..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
         </div>
      </div>

      {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
             <GraduationCap size={48} className="mx-auto mb-3 opacity-20" />
             <p>Nenhuma turma encontrada.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map(cls => (
                  <GlassCard key={cls.id} className="group hover:bg-white/60 transition-colors flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {cls.status === 'active' ? 'Ativa' : 'Arquivada'}
                          </span>
                      </div>

                      <div className="space-y-3 mb-6 flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                              <BookOpen size={16} className="text-indigo-500" />
                              <span className="truncate">{cls.courses?.title || 'Sem Curso Associado'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar size={16} className="text-indigo-500" />
                              <span>
                                  {cls.start_date ? new Date(cls.start_date).toLocaleDateString('pt-PT') : 'N/A'} 
                                  {' - '}
                                  {cls.end_date ? new Date(cls.end_date).toLocaleDateString('pt-PT') : 'N/A'}
                              </span>
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => handleEdit(cls)}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDelete(cls.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                      </div>
                  </GlassCard>
              ))}
          </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-lg shadow-2xl border-white/80 bg-white/95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingClass.id ? 'Editar Turma' : 'Nova Turma'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Nome da Turma</label>
                        <input 
                            type="text" 
                            required
                            value={editingClass.name}
                            onChange={e => setEditingClass({...editingClass, name: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            placeholder="Ex: Turma A - 2024"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Curso Associado</label>
                        <select 
                            value={editingClass.course_id || ''}
                            onChange={e => setEditingClass({...editingClass, course_id: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        >
                            <option value="">Nenhum</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Data Início</label>
                            <input 
                                type="date" 
                                value={editingClass.start_date || ''}
                                onChange={e => setEditingClass({...editingClass, start_date: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Data Fim</label>
                            <input 
                                type="date" 
                                value={editingClass.end_date || ''}
                                onChange={e => setEditingClass({...editingClass, end_date: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Estado</label>
                        <select 
                            value={editingClass.status}
                            onChange={e => setEditingClass({...editingClass, status: e.target.value as any})}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        >
                            <option value="active">Ativa</option>
                            <option value="completed">Concluída</option>
                            <option value="archived">Arquivada</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin" size={18}/> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
      )}
    </div>
  );
};
