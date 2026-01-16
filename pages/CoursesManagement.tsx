import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { RichTextEditor } from '../components/RichTextEditor';
import { 
  Plus, Edit2, Trash2, Search, Filter, Loader2, Save, X, 
  Image as ImageIcon, Upload, CheckCircle, AlertTriangle, Eye, EyeOff, BookOpen, RefreshCw 
} from 'lucide-react';
import { Course } from '../types';

export const CoursesManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Estado de Dados
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar Cursos
  const fetchCourses = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      // FIX v1.2.35: Query padrão sem alias para garantir compatibilidade.
      // Se a relação 'profiles' falhar, o utilizador verá o erro no alert abaixo.
      const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
          console.error("Erro Supabase:", error);
          alert("Erro ao carregar cursos: " + error.message + "\n\nPor favor atualize o SQL no Dashboard.");
          throw error;
      }
      setCourses(data || []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // CRUD Actions
  const handleCreate = () => {
    setEditingCourse({
      title: '',
      description: '',
      status: 'draft',
      instructor_id: user?.id,
      cover_image: ''
    });
    setCoverPreview('');
    setIsModalOpen(true);
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setCoverPreview(course.cover_image || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este curso? Esta ação é irreversível.')) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      await fetchCourses();
    } catch (err: any) {
      alert("Erro ao eliminar: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !user) return;
    
    setProcessing(true);
    try {
      const courseData = {
        title: editingCourse.title,
        description: editingCourse.description,
        status: editingCourse.status,
        cover_image: coverPreview,
        instructor_id: editingCourse.instructor_id || user.id // Default to current user
      };

      let error;
      if (editingCourse.id) {
        // Update
        const { error: updateError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('courses')
          .insert([courseData]);
        error = insertError;
      }

      if (error) throw error;
      
      setIsModalOpen(false);
      
      // Pequeno delay para garantir que o Supabase processou a alteração antes de recarregar
      setTimeout(() => {
          fetchCourses();
      }, 500);

    } catch (err: any) {
      alert("Erro ao guardar: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Image Upload Handling (Base64)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite 500KB para capa
    if (file.size > 500 * 1024) {
      alert("A imagem é muito grande. Máximo de 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Filtragem
  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
               <h2 className="text-2xl font-bold text-slate-800">Gestão de Cursos</h2>
               <button 
                  onClick={() => fetchCourses()} 
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors" 
                  title="Atualizar Lista"
                >
                   <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
               </button>
           </div>
           <p className="text-slate-500 text-sm">Crie, edite e gira a visibilidade das formações.</p>
        </div>
        <button 
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
        >
            <Plus size={16} /> Novo Curso
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white/40 p-3 rounded-xl border border-white/50 backdrop-blur-sm flex gap-2">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
                type="text" 
                placeholder="Pesquisar curso..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
         </div>
      </div>

      {/* Grelha de Cursos */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
           <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
           <p>Nenhum curso encontrado.</p>
           <button onClick={fetchCourses} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Tentar atualizar</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredCourses.map(course => (
             <GlassCard key={course.id} className="group relative flex flex-col h-full hover:bg-white/60 transition-colors">
                {/* Badge de Status */}
                <div className={`absolute top-4 right-4 z-10 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 shadow-sm border
                    ${course.status === 'published' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {course.status === 'published' ? <Eye size={12} /> : <EyeOff size={12} />}
                    {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                </div>

                {/* Imagem */}
                <div className="h-40 bg-slate-200 rounded-lg mb-4 overflow-hidden relative">
                    {course.cover_image ? (
                        <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                           <ImageIcon size={32} />
                        </div>
                    )}
                </div>

                {/* Conteúdo */}
                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1">{course.title}</h3>
                <div 
                   className="text-slate-500 text-xs mb-4 line-clamp-2 rich-text-preview" 
                   dangerouslySetInnerHTML={{__html: course.description || '<p>Sem descrição.</p>'}} 
                />
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">
                        Instrutor: {course.profiles?.full_name || 'Desconhecido'}
                    </span>
                    <div className="flex gap-2">
                        <button 
                           onClick={() => handleEdit(course)}
                           className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" 
                           title="Editar"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                           onClick={() => handleDelete(course.id)}
                           className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" 
                           title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
             </GlassCard>
           ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-white/80 bg-white/95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingCourse.id ? 'Editar Curso' : 'Novo Curso'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Imagem de Capa */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Imagem de Capa</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-all overflow-hidden relative group"
                        >
                            {coverPreview ? (
                                <>
                                    <img src={coverPreview} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-medium flex items-center gap-2"><Upload size={16} /> Alterar Imagem</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-400 text-center">
                                    <ImageIcon size={32} className="mx-auto mb-2" />
                                    <p className="text-sm font-medium">Clique para fazer upload</p>
                                    <p className="text-xs">Max: 500KB</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Título do Curso</label>
                            <input 
                                type="text" 
                                required
                                value={editingCourse.title}
                                onChange={e => setEditingCourse({...editingCourse, title: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                placeholder="Ex: Introdução ao React"
                            />
                        </div>
                        
                        <div>
                             <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Visibilidade</label>
                             <select 
                                value={editingCourse.status}
                                onChange={e => setEditingCourse({...editingCourse, status: e.target.value as any})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                             >
                                <option value="draft">Rascunho (Oculto)</option>
                                <option value="published">Publicado (Visível)</option>
                                <option value="archived">Arquivado</option>
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Descrição Completa</label>
                        <RichTextEditor 
                            value={editingCourse.description || ''}
                            onChange={val => setEditingCourse({...editingCourse, description: val})}
                            placeholder="Descreva o conteúdo do curso, objetivos e requisitos..."
                            className="bg-white"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)} 
                            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Guardar Curso
                        </button>
                    </div>

                </form>
            </GlassCard>
        </div>
      )}
    </div>
  );
};