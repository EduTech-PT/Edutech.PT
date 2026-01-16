import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { RichTextEditor } from '../components/RichTextEditor';
import { 
  Plus, Edit2, Trash2, Search, Filter, Loader2, Save, X, 
  Image as ImageIcon, Upload, CheckCircle, AlertTriangle, Eye, EyeOff, BookOpen, RefreshCw,
  Layout, Book, BarChart2, MessageCircle
} from 'lucide-react';
import { Course } from '../types';

// Tipos auxiliares para a configuração dos campos
type FieldCategory = 'structural' | 'content' | 'bi' | 'support';

interface FieldConfig {
  key: string;
  label: string;
  helpText: string;
  type: 'text' | 'textarea' | 'richtext';
  category: FieldCategory;
}

// Configuração dos Campos Novos
const COURSE_FIELDS: FieldConfig[] = [
  // 1. Dados Estruturais
  { key: 'target_audience', label: 'Público-alvo', type: 'text', category: 'structural', helpText: 'Ex: Gestores, analistas iniciantes.' },
  { key: 'workload', label: 'Carga Horária e ECTS', type: 'text', category: 'structural', helpText: 'Ex: 40h totais, 2 ECTS.' },
  { key: 'modality', label: 'Modalidade de Ensino', type: 'text', category: 'structural', helpText: 'Ex: 100% Online Assíncrono.' },
  { key: 'certification', label: 'Certificação', type: 'textarea', category: 'structural', helpText: 'Detalhes sobre o certificado e valor no mercado.' },
  
  // 2. Conteúdo e Aprendizagem
  { key: 'objectives', label: 'Objetivos de Aprendizagem', type: 'textarea', category: 'content', helpText: 'O que o aluno será capaz de fazer no final?' },
  { key: 'program', label: 'Currículo / Módulos', type: 'richtext', category: 'content', helpText: 'Estrutura detalhada dos módulos do curso.' },
  { key: 'methodology', label: 'Metodologia', type: 'textarea', category: 'content', helpText: 'Ex: Baseado em projetos, microlearning, etc.' },

  // 3. Business Intelligence (BI)
  { key: 'tools', label: 'Ferramentas Utilizadas', type: 'text', category: 'bi', helpText: 'Ex: Power BI, SQL, Python, Tableau.' },
  { key: 'skills', label: 'Competências Técnicas', type: 'textarea', category: 'bi', helpText: 'Ex: Modelagem de dados, ETL, Storytelling.' },
  { key: 'practical_cases', label: 'Casos Práticos', type: 'textarea', category: 'bi', helpText: 'Descrição dos projetos reais ou simulações.' },

  // 4. Conversão e Suporte
  { key: 'support', label: 'Suporte ao Aluno', type: 'text', category: 'support', helpText: 'Canais disponíveis (Email, WhatsApp) e SLA.' },
  { key: 'testimonials', label: 'Prova Social / Depoimentos', type: 'richtext', category: 'support', helpText: 'Citações de alunos anteriores.' },
  { key: 'bonus', label: 'Bónus e Materiais', type: 'textarea', category: 'support', helpText: 'Templates, guias, comunidades exclusivas.' },
  { key: 'accessibility', label: 'Acessibilidade', type: 'text', category: 'support', helpText: 'Legendas, transcrições, leitores de ecrã.' },
];

// Componente de Campo Reutilizável
const CourseFieldInput: React.FC<{
  config: FieldConfig;
  value: string;
  isVisible: boolean;
  onChange: (val: string) => void;
  onToggleVisibility: () => void;
}> = ({ config, value, isVisible, onChange, onToggleVisibility }) => {
  return (
    <div className="bg-white/50 p-4 rounded-xl border border-white/60 mb-4 transition-all hover:border-indigo-200">
      <div className="flex justify-between items-start mb-2">
         <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                {config.label}
                {!isVisible && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Oculto</span>}
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">{config.helpText}</p>
         </div>
         <button 
            type="button"
            onClick={onToggleVisibility}
            className={`p-1.5 rounded-lg transition-colors ${isVisible ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            title={isVisible ? "Visível no site" : "Oculto no site"}
         >
            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
         </button>
      </div>
      
      {config.type === 'richtext' ? (
        <RichTextEditor value={value} onChange={onChange} className="bg-white" />
      ) : config.type === 'textarea' ? (
        <textarea 
            className="w-full p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm min-h-[80px]"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Insira ${config.label.toLowerCase()}...`}
        />
      ) : (
        <input 
            type="text"
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Insira ${config.label.toLowerCase()}...`}
        />
      )}
    </div>
  );
};


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
  
  // Estado das Abas do Modal
  const [activeTab, setActiveTab] = useState<'general' | FieldCategory>('general');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar Cursos
  const fetchCourses = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
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
      cover_image: '',
      details: {} // Objeto vazio inicial
    });
    setCoverPreview('');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setCoverPreview(course.cover_image || '');
    setActiveTab('general');
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
        instructor_id: editingCourse.instructor_id || user.id,
        details: editingCourse.details || {} // Guardar o JSONB
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
      
      setTimeout(() => {
          fetchCourses();
      }, 500);

    } catch (err: any) {
      alert("Erro ao guardar: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Funções de manipulação do campo 'details' JSONB
  const updateDetailValue = (key: string, value: string) => {
      setEditingCourse(prev => {
          if (!prev) return null;
          const currentDetails = prev.details || {};
          const currentField = currentDetails[key] || { visible: true }; // Default visible true
          
          return {
              ...prev,
              details: {
                  ...currentDetails,
                  [key]: { ...currentField, value }
              }
          };
      });
  };

  const toggleDetailVisibility = (key: string) => {
      setEditingCourse(prev => {
          if (!prev) return null;
          const currentDetails = prev.details || {};
          const currentField = currentDetails[key] || { value: '', visible: true };

          return {
              ...prev,
              details: {
                  ...currentDetails,
                  [key]: { ...currentField, visible: !currentField.visible }
              }
          };
      });
  };

  // Image Upload Handling (Base64)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const getInstructorName = (course: any) => {
      if (!course.profiles) return 'Desconhecido';
      if (Array.isArray(course.profiles)) {
          return course.profiles[0]?.full_name || 'Desconhecido';
      }
      return course.profiles.full_name || 'Desconhecido';
  };

  // Render Tabs Logic
  const renderTabButton = (id: 'general' | FieldCategory, label: string, Icon: any) => (
      <button
        type="button"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-slate-800">Gestão de Cursos</h2>
               {!loading && (
                   <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-sm font-bold border border-indigo-200 shadow-sm">
                       {courses.length}
                   </span>
               )}
               <button onClick={() => fetchCourses()} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors" title="Atualizar Lista">
                   <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
               </button>
           </div>
           <p className="text-slate-500 text-sm">Crie, edite e gira a visibilidade das formações.</p>
        </div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
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
                        Instrutor: {getInstructorName(course)}
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
            <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-white/80 bg-white/95 p-0">
                
                {/* Modal Header */}
                <div className="p-6 pb-2 flex justify-between items-center border-b border-slate-100 bg-white/50">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingCourse.id ? 'Editar Curso' : 'Novo Curso'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-white/30 px-4">
                    {renderTabButton('general', 'Visão Geral', Layout)}
                    {renderTabButton('structural', 'Estrutura & Logística', Book)}
                    {renderTabButton('content', 'Conteúdo & Aprendizagem', BookOpen)}
                    {renderTabButton('bi', 'BI & Ferramentas', BarChart2)}
                    {renderTabButton('support', 'Conversão & Suporte', MessageCircle)}
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <form id="course-form" onSubmit={handleSave} className="space-y-6">
                        
                        {/* ABA GERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Imagem de Capa */}
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Imagem de Capa</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-all overflow-hidden relative group"
                                        >
                                            {coverPreview ? (
                                                <>
                                                    <img src={coverPreview} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white font-medium flex items-center gap-2 text-xs"><Upload size={14} /> Alterar</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-slate-400 text-center p-4">
                                                    <ImageIcon size={32} className="mx-auto mb-2" />
                                                    <p className="text-xs font-medium">Upload Imagem</p>
                                                </div>
                                            )}
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                                        </div>
                                    </div>

                                    {/* Campos Básicos */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Título do Curso</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={editingCourse.title}
                                                onChange={e => setEditingCourse({...editingCourse, title: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none"
                                                placeholder="Ex: Introdução ao React"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Visibilidade</label>
                                            <select 
                                                value={editingCourse.status}
                                                onChange={e => setEditingCourse({...editingCourse, status: e.target.value as any})}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="draft">Rascunho (Oculto)</option>
                                                <option value="published">Publicado (Visível)</option>
                                                <option value="archived">Arquivado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Descrição Curta</label>
                                            <RichTextEditor 
                                                value={editingCourse.description || ''}
                                                onChange={val => setEditingCourse({...editingCourse, description: val})}
                                                placeholder="Resumo principal do curso..."
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OUTRAS ABAS (Renderização Dinâmica) */}
                        {['structural', 'content', 'bi', 'support'].includes(activeTab) && (
                            <div className="animate-in fade-in duration-300 space-y-2">
                                {COURSE_FIELDS.filter(f => f.category === activeTab).map(field => {
                                    // Get current value and visibility safely
                                    const detail = editingCourse.details?.[field.key] || { value: '', visible: true };
                                    
                                    return (
                                        <CourseFieldInput
                                            key={field.key}
                                            config={field}
                                            value={detail.value}
                                            isVisible={detail.visible}
                                            onChange={(val) => updateDetailValue(field.key, val)}
                                            onToggleVisibility={() => toggleDetailVisibility(field.key)}
                                        />
                                    );
                                })}
                            </div>
                        )}

                    </form>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 bg-white/80 flex gap-3 justify-end backdrop-blur-sm">
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)} 
                        className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        form="course-form"
                        disabled={processing}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Alterações
                    </button>
                </div>
            </GlassCard>
        </div>
      )}
    </div>
  );
};