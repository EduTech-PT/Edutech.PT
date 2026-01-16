import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from './Profile';
import { CoursesManagement } from './CoursesManagement';
import { RichTextEditor } from '../components/RichTextEditor';
import { 
  BarChart, Activity, Users, BookOpen, AlertTriangle, 
  Database, Mail, Code, Sparkles, Save, Link as LinkIcon, Unlink, Eye, EyeOff, FileText, LayoutTemplate, Globe,
  Search, Filter, Trash2, Edit2, Plus, MoreHorizontal, CheckSquare, Square, X, Check, Loader2, Send, RefreshCw, AlertCircle, Camera, HelpCircle,
  Image as ImageIcon, Upload, Type, ExternalLink, MessageSquare
} from 'lucide-react';
import { isSupabaseConfigured, supabase, REQUIRED_SQL_SCHEMA, CURRENT_SQL_VERSION } from '../services/supabase';
import { UserRole } from '../types';

// --- SUB-COMPONENTES DE PÁGINA ---

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [dbSqlVersion, setDbSqlVersion] = useState<string | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(true);

  // MOCK DATA REMOVIDO: Agora mostra 0 ou placeholders até que existam endpoints reais
  const stats = [
    { label: 'Cursos Ativos', value: '0', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Alunos', value: '0', icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: 'Taxa de Conclusão', value: '-', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Receita Mensal', value: '€ 0,00', icon: BarChart, color: 'text-violet-600', bg: 'bg-violet-100' },
  ];

  // Verifica a versão do SQL no Banco de Dados
  useEffect(() => {
    if (isSupabaseConfigured && user?.role === 'admin') {
      const checkVersion = async () => {
        const { data, error } = await supabase
          .from('system_integrations')
          .select('value')
          .eq('key', 'sql_version')
          .single();
        
        if (!error && data?.value?.version) {
          setDbSqlVersion(data.value.version);
        } else {
          setDbSqlVersion('v0.0.0'); // Assume desatualizado se não existir
        }
        setCheckingVersion(false);
      };
      checkVersion();
    } else {
        setCheckingVersion(false);
    }
  }, [user]);

  const needsSqlUpdate = user?.role === 'admin' && !checkingVersion && dbSqlVersion !== CURRENT_SQL_VERSION;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Olá, {user?.full_name?.split(' ')[0] || 'Utilizador'}</h1>
          <p className="text-slate-500 mt-1">Aqui está o resumo da sua plataforma hoje.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-slate-500 bg-white/40 px-3 py-1 rounded-lg border border-white/50">
            {CURRENT_SQL_VERSION}
            </div>
            {!isSupabaseConfigured && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <AlertTriangle size={12} /> Modo Local (Sem Supabase)
                </div>
            )}
        </div>
      </div>

      {/* ALERTA DE SQL DESATUALIZADO */}
      {needsSqlUpdate && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                  <Database size={24} />
              </div>
              <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-800">Atualização de Base de Dados Necessária</h3>
                  <p className="text-amber-700 mt-1 text-sm">
                      Existe uma nova versão do código SQL <strong>({CURRENT_SQL_VERSION})</strong>. 
                      A versão atual no Supabase é {dbSqlVersion}.
                  </p>
                  <div className="mt-3">
                      <Link to="/dashboard/sql" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors">
                          <Code size={16} /> Ver e Atualizar SQL
                      </Link>
                  </div>
              </div>
          </div>
      )}

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
            {/* MOCK DATA REMOVIDO */}
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <Activity size={32} className="mb-2 opacity-20"/>
                <p className="text-sm">Sem atividade recente para mostrar.</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="Cursos Populares">
          <div className="space-y-4">
             <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-sm">
                {isSupabaseConfigured 
                    ? "Sem dados suficientes." 
                    : "⚠️ Conecte o Supabase para ver dados reais."}
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- GESTÃO DE UTILIZADORES (IMPLEMENTAÇÃO COMPLETA) ---
const UsersManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Estado de Dados
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Estado de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Estado de Modais
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Estados do Convite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('aluno');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'emailjs' | 'outlook'>('emailjs');

  // Estado de Ações
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const roles: {value: UserRole, label: string, color: string}[] = [
      { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-700' },
      { value: 'editor', label: 'Editor', color: 'bg-pink-100 text-pink-700' },
      { value: 'formador', label: 'Formador', color: 'bg-blue-100 text-blue-700' },
      { value: 'aluno', label: 'Aluno', color: 'bg-emerald-100 text-emerald-700' }
  ];

  // Fetch Users
  const fetchUsers = async () => {
      if (!isSupabaseConfigured) return;
      setLoading(true);
      try {
          let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
          
          if (roleFilter !== 'all') {
              query = query.eq('role', roleFilter);
          }
          if (searchTerm) {
              query = query.ilike('email', `%${searchTerm}%`);
          }

          const { data, error } = await query;
          if (error) throw error;
          setUsers(data || []);
      } catch (err) {
          console.error("Erro ao buscar utilizadores:", err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchUsers();
  }, [roleFilter, searchTerm]); // Auto-refresh on filter change

  // Selection Logic
  const toggleSelectAll = () => {
      if (selectedIds.length === users.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(users.map(u => u.id));
      }
  };

  const toggleSelectUser = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(prev => prev.filter(uid => uid !== id));
      } else {
          setSelectedIds(prev => [...prev, id]);
      }
  };

  // Sync Profiles
  const handleSync = async () => {
      setIsSyncing(true);
      try {
          const { error } = await supabase.rpc('sync_profiles');
          if (error) throw error;
          await fetchUsers();
          alert("Perfis sincronizados com sucesso!");
      } catch (err: any) {
          alert("Erro ao sincronizar: " + err.message + "\n\n(Execute o SQL atualizado no Supabase se este erro persistir)");
      } finally {
          setIsSyncing(false);
      }
  };

  // Bulk Actions
  const handleBulkRoleUpdate = async (newRole: UserRole) => {
      if (!confirm(`Tem a certeza que deseja mudar o cargo de ${selectedIds.length} utilizadores para "${newRole}"?`)) return;
      setProcessing(true);
      try {
          const { error } = await supabase.rpc('bulk_update_roles', { 
              user_ids: selectedIds, 
              new_role: newRole 
          });
          if (error) throw error;
          await fetchUsers();
          setSelectedIds([]);
      } catch (err: any) {
          alert("Erro: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  const handleBulkDelete = async () => {
      if (!confirm(`ATENÇÃO: Vai remover o acesso de ${selectedIds.length} utilizadores. Esta ação é irreversível na plataforma. Continuar?`)) return;
      setProcessing(true);
      try {
          const { error } = await supabase.rpc('bulk_delete_users', { user_ids: selectedIds });
          if (error) throw error;
          await fetchUsers();
          setSelectedIds([]);
      } catch (err: any) {
          alert("Erro: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  // Single User Actions
  const handleSingleDelete = async (id: string, email: string) => {
      if (!confirm(`ATENÇÃO: Deseja eliminar o utilizador ${email}? Esta ação remove o acesso à plataforma.`)) return;
      setProcessing(true);
      try {
          // Reutiliza a função bulk_delete_users mas com um único ID
          const { error } = await supabase.rpc('bulk_delete_users', { user_ids: [id] });
          if (error) throw error;
          await fetchUsers();
          // Remove from selection if selected
          if (selectedIds.includes(id)) {
              setSelectedIds(prev => prev.filter(uid => uid !== id));
          }
      } catch (err: any) {
          alert("Erro ao eliminar: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  // Edit Single User
  const openEditModal = (user: any) => {
      setEditingUser(user);
      setIsEditOpen(true);
  };

  const saveEditUser = async () => {
      if (!editingUser) return;
      setProcessing(true);
      try {
           const { error } = await supabase.from('profiles').update({
               full_name: editingUser.full_name,
               role: editingUser.role
           }).eq('id', editingUser.id);
           if (error) throw error;
           setIsEditOpen(false);
           await fetchUsers();
      } catch (err: any) {
          alert("Erro ao editar: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  // Invite User (Logic atualizada para carregar templates da BD e AUTORIZAR no Supabase)
  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingInvite(true);

      // 0. PRÉ-AUTORIZAÇÃO NO SUPABASE (Whitelist)
      // Isto garante que quando o utilizador fizer login, a conta seja criada com o cargo certo
      try {
          const { error } = await supabase.rpc('create_invite', { 
              email_input: inviteEmail, 
              role_input: inviteRole 
          });
          if (error) {
              console.error("Erro ao criar convite no backend:", error);
              alert("Erro ao autorizar email no sistema: " + error.message);
              setSendingInvite(false);
              return;
          }
      } catch (rpcError: any) {
          console.error("Erro RPC:", rpcError);
          alert("Erro de conexão ao autorizar convite. Verifique o SQL no Dashboard.");
          setSendingInvite(false);
          return;
      }

      // 1. Carregar Configuração de Convites (Templates)
      let inviteConfig = {
          subject: 'Convite para EduTech PT',
          redirectUrl: window.location.origin + '/login',
          htmlTemplate: '<p>Olá,</p><p>Foi convidado(a) para se juntar à plataforma <strong>EduTech PT</strong> com o perfil de <strong>{{role}}</strong>.</p><p>Clique no link abaixo para criar a sua conta:</p><p><a href="{{link}}">Aceitar Convite</a></p>',
          textTemplate: 'Olá!\n\nFoi convidado(a) para se juntar à plataforma EduTech PT com o perfil de {{role}}.\n\nAceda aqui: {{link}}\n\nObrigado.'
      };

      // Carregar também o logótipo
      let logoUrl = '';

      try {
          // Fetch Config Convite
          const { data: configData } = await supabase
            .from('system_integrations')
            .select('value')
            .eq('key', 'email_invite_config')
            .single();
          
          if (configData?.value) {
              inviteConfig = { ...inviteConfig, ...configData.value };
          }

          // Fetch Branding (Logo)
          const { data: brandingData } = await supabase
            .from('system_integrations')
            .select('value')
            .eq('key', 'site_branding')
            .single();
          
          if (brandingData?.value?.logoUrl) {
              logoUrl = brandingData.value.logoUrl;
          }

      } catch(e) {
          console.warn("Usando configuração padrão de convite.");
      }

      // Preparar Variáveis
      const targetLink = inviteConfig.redirectUrl;
      const roleName = inviteRole.toUpperCase();

      // Substituir Placeholders (Simples)
      const finalSubject = inviteConfig.subject;
      const finalHtmlBody = inviteConfig.htmlTemplate
          .replace(/{{role}}/g, roleName)
          .replace(/{{link}}/g, targetLink)
          .replace(/{{logo_url}}/g, logoUrl);
      
      const finalTextBody = inviteConfig.textTemplate
          .replace(/{{role}}/g, roleName)
          .replace(/{{link}}/g, targetLink)
          .replace(/{{logo_url}}/g, logoUrl);

      // 2. MÉTODO: OUTLOOK (MAILTO)
      if (inviteMethod === 'outlook') {
          const mailtoLink = `mailto:${inviteEmail}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalTextBody)}`;
          window.location.href = mailtoLink;
          alert(`Utilizador autorizado! O seu cliente de email foi aberto com o texto configurado.`);
          setIsInviteOpen(false);
          setInviteEmail('');
          setSendingInvite(false);
          return;
      }

      // 3. MÉTODO: EMAILJS (AUTOMÁTICO)
      // Buscar credenciais EmailJS da BD
      let emailConfig = null;
      try {
          const { data } = await supabase
            .from('system_integrations')
            .select('value')
            .eq('key', 'emailjs')
            .single();
          emailConfig = data?.value;
      } catch(e) {
          console.warn("EmailJS não configurado.");
      }

      if (emailConfig && emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
          try {
              const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      service_id: emailConfig.serviceId,
                      template_id: emailConfig.templateId,
                      user_id: emailConfig.publicKey,
                      template_params: {
                          // Variáveis Genéricas Solicitadas
                          to_name: 'Novo Membro', 
                          to_email: inviteEmail,
                          email_title: finalSubject,
                          email_body: finalHtmlBody, // HTML content gerado
                          footer_info: 'EduTech PT - Plataforma de Gestão de Formação',
                      }
                  })
              });

              if (response.ok) {
                  alert(`Convite enviado e utilizador autorizado com sucesso para ${inviteEmail}!`);
                  setIsInviteOpen(false);
                  setInviteEmail('');
                  setSendingInvite(false);
                  return;
              } else {
                  console.warn("Falha no EmailJS:", await response.text());
                  alert("Utilizador autorizado na BD, mas falha no envio do email automático. Verifique as quotas.");
              }
          } catch (err) {
              console.error("Erro no envio EmailJS:", err);
              alert("Erro de conexão com EmailJS.");
          }
      } else {
          alert("EmailJS não está configurado. O utilizador foi autorizado na base de dados, mas o email não foi enviado.");
      }
      setSendingInvite(false);
  };

  return (
    <div className="space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Utilizadores</h2>
            <div className="flex gap-2">
                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                    title="Reparar perfis em falta"
                >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Sincronizando..." : "Sincronizar"}
                </button>
                <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Plus size={16} /> Adicionar Novo
                </button>
            </div>
        </div>

        {/* Filters & Bulk Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-white/40 p-3 rounded-xl border border-white/50 backdrop-blur-sm">
            
            {/* Left: Search & Filter */}
            <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar email..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <div className="relative">
                    <select 
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all">Todos os Cargos</option>
                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>

            {/* Right: Bulk Actions (Conditional) */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded">{selectedIds.length} selecionados</span>
                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                    
                    <select 
                        onChange={(e) => {
                            if(e.target.value) handleBulkRoleUpdate(e.target.value as UserRole);
                            e.target.value = '';
                        }}
                        className="bg-white/80 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded hover:bg-white cursor-pointer"
                        disabled={processing}
                    >
                        <option value="">Mudar Cargo...</option>
                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>

                    <button 
                        onClick={handleBulkDelete}
                        disabled={processing}
                        className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            )}
        </div>

        {/* Table */}
        <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="py-3 pl-4 w-10">
                                <button onClick={toggleSelectAll} className="flex items-center text-slate-400 hover:text-indigo-600">
                                    {users.length > 0 && selectedIds.length === users.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>
                            </th>
                            <th className="py-3 px-4">Utilizador</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Cargo</th>
                            <th className="py-3 px-4">Data Registo</th>
                            <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">Nenhum utilizador encontrado.</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className={`hover:bg-indigo-50/30 transition-colors ${selectedIds.includes(u.id) ? 'bg-indigo-50/60' : ''}`}>
                                    <td className="py-3 pl-4">
                                        <button onClick={() => toggleSelectUser(u.id)} className={`flex items-center ${selectedIds.includes(u.id) ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}>
                                            {selectedIds.includes(u.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover"/> : (u.full_name?.[0] || u.email[0])}
                                            </div>
                                            <span className="font-medium text-slate-800">{u.full_name || 'Sem Nome'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${roles.find(r => r.value === u.role)?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-slate-400">
                                        {new Date(u.created_at).toLocaleDateString('pt-PT')}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleSingleDelete(u.id, u.email)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" 
                                                title="Eliminar"
                                                disabled={processing}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center flex justify-between">
                <span>Total: {users.length} utilizadores</span>
                <span>Dados do Supabase (public.profiles)</span>
            </div>
        </GlassCard>

        {/* MODAL: INVITE USER */}
        {isInviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <GlassCard className="w-full max-w-md shadow-2xl border-white/80 bg-white/90">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Convidar Utilizador</h3>
                        <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Email do Destinatário</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Cargo Inicial</label>
                            <select 
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value as UserRole)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            >
                                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        
                        {/* Seletor de Método de Envio */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Método de Envio</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setInviteMethod('emailjs')}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${inviteMethod === 'emailjs' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <Send size={20} className="mb-1" />
                                    <span className="text-xs font-bold">Automático (EmailJS)</span>
                                    <span className="text-[10px] opacity-70">Limite 200/mês</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setInviteMethod('outlook')}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${inviteMethod === 'outlook' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <ExternalLink size={20} className="mb-1" />
                                    <span className="text-xs font-bold">Manual (Outlook)</span>
                                    <span className="text-[10px] opacity-70">Sem limites</span>
                                </button>
                            </div>
                        </div>

                        <div className={`p-3 rounded-lg text-xs flex gap-2 ${inviteMethod === 'emailjs' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {inviteMethod === 'emailjs' 
                                ? <p>Enviaremos o email automaticamente usando a conta configurada. Certifique-se que não excede os 200 envios mensais.</p>
                                : <p>Abriremos o seu Outlook ou App de Email para enviar a mensagem manualmente. Ideal para poupar envios automáticos.</p>
                            }
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsInviteOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                            <button 
                                type="submit" 
                                disabled={sendingInvite}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {sendingInvite ? <Loader2 className="animate-spin" size={18}/> : (inviteMethod === 'emailjs' ? 'Enviar Automático' : 'Abrir Outlook')}
                            </button>
                        </div>
                    </form>
                </GlassCard>
            </div>
        )}

        {/* MODAL: EDIT USER */}
        {isEditOpen && editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <GlassCard className="w-full max-w-md shadow-2xl border-white/80 bg-white/90">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Editar Utilizador</h3>
                        <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 overflow-hidden border-4 border-white shadow-sm">
                                {editingUser.avatar_url ? <img src={editingUser.avatar_url} className="w-full h-full object-cover"/> : (editingUser.full_name?.[0] || editingUser.email[0])}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Nome Completo</label>
                            <input 
                                type="text" 
                                value={editingUser.full_name || ''}
                                onChange={e => setEditingUser({...editingUser, full_name: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Email (Apenas leitura)</label>
                             <input type="text" value={editingUser.email} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Cargo</label>
                            <select 
                                value={editingUser.role}
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                            >
                                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setIsEditOpen(false)} disabled={processing} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                            <button onClick={saveEditUser} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2">
                                {processing && <Loader2 className="animate-spin" size={16}/>} Guardar
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        )}
    </div>
  );
};

const SQLManagement: React.FC = () => {
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(REQUIRED_SQL_SCHEMA);
        setCopySuccess('Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    return (
        <GlassCard title="Gestão SQL & Banco de Dados">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold font-mono">
                      {CURRENT_SQL_VERSION}
                   </div>
                   <span className="text-sm text-slate-500">Versão atual do código</span>
                </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-96 whitespace-pre">
                {REQUIRED_SQL_SCHEMA}
            </div>
            <div className="mt-4 flex gap-2 items-center">
                <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                >
                    {copySuccess ? <Check size={16} /> : <Code size={16} />}
                    {copySuccess || 'Copiar SQL Completo'}
                </button>
                <div className="text-xs text-slate-500 ml-2">
                    Copie este código e cole no <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">SQL Editor do Supabase</a> para corrigir problemas de segurança.
                </div>
            </div>
        </GlassCard>
    );
};

// --- NOVO COMPONENTE: EDITOR DE CONTEÚDOS ---
const SiteContentEditor: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Texto do Perfil
    const [resizeInstructions, setResizeInstructions] = useState('Aceda ao site, faça upload da sua foto, defina 300x300px e faça o download da nova imagem.');
    const [profileUploadHint, setProfileUploadHint] = useState('<p>Clique na foto para alterar.</p><p>Max: 150KB • 300x300px</p>');

    // Configuração do Formulário de Ajuda
    const [helpFormConfig, setHelpFormConfig] = useState({
        buttonText: 'Dúvidas / Ajuda',
        modalTitle: 'Como podemos ajudar?',
        adminEmail: 'edutechpt@hotmail.com',
        subjectPrefix: '[EduTech] Dúvida:',
        helperText: 'Preencha os campos abaixo. Ao clicar em Enviar, o seu cliente de email será aberto com a mensagem pré-preenchida.'
    });
    
    // Configuração de Convites (Email)
    const [emailInviteConfig, setEmailInviteConfig] = useState({
        subject: 'Convite para EduTech PT',
        redirectUrl: window.location.origin + '/login',
        htmlTemplate: '<p>Olá,</p><p>Foi convidado(a) para se juntar à plataforma <strong>EduTech PT</strong> com o perfil de <strong>{{role}}</strong>.</p><p>Clique no link abaixo para criar a sua conta:</p><p><a href="{{link}}">Aceitar Convite</a></p>',
        textTemplate: 'Olá!\n\nFoi convidado(a) para se juntar à plataforma EduTech PT com o perfil de {{role}}.\n\nAceda aqui: {{link}}\n\nObrigado.'
    });

    // Identidade Visual
    const [branding, setBranding] = useState({
        logoUrl: '',
        faviconUrl: '',
        siteName: '' // Adicionado: Nome da Plataforma
    });

    // Textos da Landing Page (Estrutura Inicial)
    const [landingContent, setLandingContent] = useState({
        heroTitle: 'Formação profissional simples e eficaz.',
        heroSubtitle: 'Plataforma integrada para gestão de cursos, alunos e formadores. Interface moderna, rápida e focada na experiência de aprendizagem.',
        ctaPrimary: 'Começar Agora',
        ctaSecondary: 'Demonstração'
    });

    // Referências para Inputs de Arquivo
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSupabaseConfigured && user) {
            const fetchData = async () => {
                const { data } = await supabase.from('system_integrations').select('*').in('key', [
                    'resize_pixel_instructions', 
                    'landing_page_content', 
                    'profile_upload_hint', 
                    'help_form_config', 
                    'site_branding',
                    'email_invite_config'
                ]);
                if (data) {
                    data.forEach((item: any) => {
                        if (item.key === 'resize_pixel_instructions') setResizeInstructions(item.value.text);
                        if (item.key === 'profile_upload_hint') setProfileUploadHint(item.value.text);
                        if (item.key === 'landing_page_content') setLandingContent(prev => ({ ...prev, ...item.value }));
                        if (item.key === 'help_form_config') setHelpFormConfig(prev => ({ ...prev, ...item.value }));
                        if (item.key === 'site_branding') setBranding(prev => ({ ...prev, ...item.value }));
                        if (item.key === 'email_invite_config') setEmailInviteConfig(prev => ({ ...prev, ...item.value }));
                    });
                }
            };
            fetchData();
        }
    }, [user]);

    const saveContent = async (key: string, value: any) => {
        if (!isSupabaseConfigured) {
            alert("Conecte o Supabase para salvar.");
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
            alert("Conteúdo atualizado com sucesso! Recarregue a página para ver algumas alterações.");
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    // Função de Leitura de Imagem Base64
    const handleBrandingImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite 200KB para logos/favicons para não encher o JSONB
        if (file.size > 200 * 1024) {
          alert("A imagem é muito grande. Máximo de 200KB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setBranding(prev => ({
                ...prev,
                [type === 'logo' ? 'logoUrl' : 'faviconUrl']: base64
            }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Editor de Site</h1>
                    <p className="text-slate-500 mt-1">Gerir todos os textos visíveis na plataforma pública e privada.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* 1. CONFIGURAÇÃO DE CONVITES (NOVO) */}
                <GlassCard title="Configuração de Convites (Emails)">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase">Assunto do Email</label>
                            <input
                                value={emailInviteConfig.subject}
                                onChange={e => setEmailInviteConfig({...emailInviteConfig, subject: e.target.value})}
                                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase">Link de Destino</label>
                            <div className="flex gap-2">
                                <input
                                    value={emailInviteConfig.redirectUrl}
                                    onChange={e => setEmailInviteConfig({...emailInviteConfig, redirectUrl: e.target.value})}
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">O link para onde o utilizador será redirecionado ao clicar no email.</p>
                        </div>
                        
                        <hr className="border-slate-100" />
                        
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block flex items-center justify-between">
                                <span>Corpo do Email (HTML - EmailJS)</span>
                                <span className="text-[10px] bg-slate-200 px-1.5 rounded">Variáveis: {'{{role}}'}, {'{{link}}'}, {'{{logo_url}}'}</span>
                            </label>
                            <RichTextEditor
                                value={emailInviteConfig.htmlTemplate}
                                onChange={value => setEmailInviteConfig({...emailInviteConfig, htmlTemplate: value})}
                                placeholder="Corpo do email em HTML..."
                            />
                        </div>

                         <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block flex items-center justify-between">
                                <span>Corpo do Email (Texto - Outlook)</span>
                                <span className="text-[10px] bg-slate-200 px-1.5 rounded">Variáveis: {'{{role}}'}, {'{{link}}'}, {'{{logo_url}}'}</span>
                            </label>
                            <textarea
                                value={emailInviteConfig.textTemplate}
                                onChange={e => setEmailInviteConfig({...emailInviteConfig, textTemplate: e.target.value})}
                                rows={4}
                                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">Usado quando escolhe "Abrir Outlook". O Outlook não suporta HTML rico.</p>
                        </div>

                        <button 
                            onClick={() => saveContent('email_invite_config', emailInviteConfig)}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Salvar Configuração de Email
                        </button>
                    </div>
                </GlassCard>

                {/* 2. IDENTIDADE VISUAL */}
                <GlassCard title="Identidade Visual (Branding)">
                    <div className="space-y-6">
                        
                        {/* Nome do Site */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Nome da Plataforma (Logotipo em Texto)</label>
                            <div className="relative">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={branding.siteName}
                                    onChange={e => setBranding({...branding, siteName: e.target.value})}
                                    placeholder="Ex: EduTech PT"
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1 ml-1">Deixe em branco para usar o padrão "EduTech PT".</p>
                        </div>

                        <hr className="border-slate-100"/>

                        {/* Logo */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Logotipo (Imagem)</label>
                            <div className="flex items-center gap-4">
                                <div 
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors relative overflow-hidden group"
                                >
                                    {branding.logoUrl ? (
                                        <img src={branding.logoUrl} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <ImageIcon className="text-slate-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="text-white" size={16} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 mb-2">Recomendado: PNG Transparente. Max 200KB.</p>
                                    <button 
                                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Remover Imagem
                                    </button>
                                </div>
                                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleBrandingImage(e, 'logo')} />
                            </div>
                        </div>

                        <hr className="border-slate-100"/>

                        {/* Favicon */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Favicon (Ícone do Separador)</label>
                            <div className="flex items-center gap-4">
                                <div 
                                    onClick={() => faviconInputRef.current?.click()}
                                    className="w-12 h-12 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors relative overflow-hidden group"
                                >
                                    {branding.faviconUrl ? (
                                        <img src={branding.faviconUrl} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Globe className="text-slate-400" size={20} />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="text-white" size={12} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 mb-2">Formato quadrado (32x32 ou 64x64).</p>
                                    <button 
                                        onClick={() => setBranding(prev => ({ ...prev, faviconUrl: '' }))}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Remover Favicon
                                    </button>
                                </div>
                                <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleBrandingImage(e, 'favicon')} />
                            </div>
                        </div>

                        <button 
                            onClick={() => saveContent('site_branding', branding)}
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Salvar Identidade Visual
                        </button>
                    </div>
                </GlassCard>

                {/* 3. LANDING PAGE - HERO */}
                <GlassCard title="Landing Page: Hero Section">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase">Título Principal</label>
                            <input
                                value={landingContent.heroTitle}
                                onChange={e => setLandingContent({...landingContent, heroTitle: e.target.value})}
                                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase">Subtítulo (Editor Rico)</label>
                            <RichTextEditor
                                value={landingContent.heroSubtitle}
                                onChange={value => setLandingContent({...landingContent, heroSubtitle: value})}
                                placeholder="Digite o subtítulo..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase">Botão Principal</label>
                                <input 
                                    type="text"
                                    value={landingContent.ctaPrimary}
                                    onChange={e => setLandingContent({...landingContent, ctaPrimary: e.target.value})}
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase">Botão Secundário</label>
                                <input 
                                    type="text"
                                    value={landingContent.ctaSecondary}
                                    onChange={e => setLandingContent({...landingContent, ctaSecondary: e.target.value})}
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => saveContent('landing_page_content', landingContent)}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Salvar Landing Page
                        </button>
                    </div>
                </GlassCard>

                <div className="space-y-6">
                    {/* 4. ÁREA DE PERFIL */}
                    <GlassCard title="Área Privada: Perfil de Utilizador">
                        <div className="space-y-6">
                            
                            {/* Instruções do Resize Pixel */}
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Instruções de Redimensionamento (Caixa Direita)</label>
                                    <RichTextEditor 
                                        value={resizeInstructions}
                                        onChange={value => setResizeInstructions(value)}
                                        placeholder="Instruções para o utilizador..."
                                    />
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex gap-2">
                                    <Globe size={14} className="shrink-0 mt-0.5" />
                                    Este texto aparece na caixa de ajuda lateral no perfil.
                                </div>
                                <button 
                                    onClick={() => saveContent('resize_pixel_instructions', { text: resizeInstructions })}
                                    disabled={loading}
                                    className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> Salvar Instruções
                                </button>
                            </div>

                            <hr className="border-slate-200"/>

                            {/* Texto de Ajuda do Avatar */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Texto de Ajuda do Avatar (Debaixo da foto)</label>
                                    <RichTextEditor 
                                        value={profileUploadHint}
                                        onChange={setProfileUploadHint}
                                        placeholder="Texto curto abaixo do avatar..."
                                    />
                                </div>
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 flex gap-2">
                                    <Camera size={14} className="shrink-0 mt-0.5" />
                                    Este texto aparece imediatamente abaixo da foto de perfil (Ex: 'Clique na foto...').
                                </div>
                                <button 
                                    onClick={() => saveContent('profile_upload_hint', { text: profileUploadHint })}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> Salvar Texto Avatar
                                </button>
                            </div>

                        </div>
                    </GlassCard>

                     {/* 5. FORMULÁRIO DE AJUDA */}
                     <GlassCard title="Landing Page: Formulário Dúvidas">
                        <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Texto do Botão</label>
                                    <input
                                        value={helpFormConfig.buttonText}
                                        onChange={e => setHelpFormConfig({...helpFormConfig, buttonText: e.target.value})}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Título do Modal</label>
                                    <input
                                        value={helpFormConfig.modalTitle}
                                        onChange={e => setHelpFormConfig({...helpFormConfig, modalTitle: e.target.value})}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase">Email de Destino (mailto)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        value={helpFormConfig.adminEmail}
                                        onChange={e => setHelpFormConfig({...helpFormConfig, adminEmail: e.target.value})}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase">Prefixo do Assunto</label>
                                <input
                                    value={helpFormConfig.subjectPrefix}
                                    onChange={e => setHelpFormConfig({...helpFormConfig, subjectPrefix: e.target.value})}
                                    placeholder="Ex: [EduTech] Contacto:"
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase">Texto de Ajuda (Dentro do Modal)</label>
                                <textarea
                                    value={helpFormConfig.helperText}
                                    onChange={e => setHelpFormConfig({...helpFormConfig, helperText: e.target.value})}
                                    rows={3}
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 flex gap-2">
                                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                                O botão aparece na Navbar. O envio usa o cliente de email do utilizador (mailto).
                            </div>
                            <button 
                                onClick={() => saveContent('help_form_config', helpFormConfig)}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Salvar Configuração Dúvidas
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE DE DEFINIÇÕES (AGORA APENAS INTEGRAÇÕES) ---
const Settings: React.FC = () => {
  const { user } = useAuth();
  
  const [sbConfig, setSbConfig] = useState({
    url: localStorage.getItem('edutech_sb_url') || '',
    key: localStorage.getItem('edutech_sb_key') || ''
  });

  const [integrations, setIntegrations] = useState({
    emailjs: { serviceId: '', templateId: '', publicKey: '' },
    google: { scriptUrl: '' },
    gemini: { apiKey: '' },
  });

  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

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
      window.location.reload(); 
    }
  };

  const handleSbClear = () => {
    localStorage.removeItem('edutech_sb_url');
    localStorage.removeItem('edutech_sb_key');
    window.location.reload();
  };

  const saveIntegration = async (key: string, value: any) => {
    if (!isSupabaseConfigured) {
      alert("Conecte o Supabase primeiro.");
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
          <h1 className="text-3xl font-bold text-slate-800">Integrações Técnicas</h1>
          <p className="text-slate-500 mt-1">Gerir API Keys e conexões externas.</p>
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
                <LinkIcon size={12} /> Conectado
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

        {/* 2. EMAILJS CONFIG */}
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

        {/* 3. GOOGLE APPS SCRIPT */}
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

        {/* 4. GEMINI AI */}
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

                <Route path="site-content" element={
                    user.role === 'admin' 
                    ? <SiteContentEditor /> 
                    : <Navigate to="/dashboard" replace />
                } />

                <Route path="sql" element={
                    user.role === 'admin' 
                    ? <SQLManagement /> 
                    : <Navigate to="/dashboard" replace />
                } />

                <Route path="profile" element={<Profile />} />

                {/* ROTA DE GESTÃO DE CURSOS (NOVO) */}
                <Route path="courses" element={
                    (user.role === 'admin' || user.role === 'formador')
                    ? <CoursesManagement /> 
                    : <GlassCard title="Acesso Negado"><p className="text-slate-500">Apenas Formadores e Admins podem gerir cursos.</p></GlassCard>
                } />

                <Route path="permissions" element={<GlassCard title="Permissões"><p className="text-slate-500">Gestão de permissões em desenvolvimento.</p></GlassCard>} />
                <Route path="materials" element={<GlassCard title="Meus Materiais"><p className="text-slate-500">Área do aluno em desenvolvimento.</p></GlassCard>} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </main>
    </div>
  );
};