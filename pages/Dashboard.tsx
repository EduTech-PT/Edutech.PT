import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from './Profile';
import { CoursesManagement } from './CoursesManagement';
import { SqlManager } from './SqlManager'; 
import { SiteContentEditor } from './SiteContentEditor'; 
import { PermissionsManager } from './PermissionsManager'; 
import { IntegrationsManager } from './IntegrationsManager'; 
import { MyMaterials } from './MyMaterials';
import { ClassesManager } from './ClassesManager'; 
import { 
  BarChart, Activity, Users, BookOpen, AlertTriangle, 
  Database, Mail, Code, Sparkles, Save, Link as LinkIcon, Unlink, Eye, EyeOff, FileText, LayoutTemplate, Globe,
  Search, Filter, Trash2, Edit2, Plus, MoreHorizontal, CheckSquare, Square, X, Check, Loader2, Send, RefreshCw, AlertCircle, Camera, HelpCircle,
  Image as ImageIcon, Upload, Type, ExternalLink, MessageSquare, ShieldCheck, Clock, GraduationCap
} from 'lucide-react';
import { isSupabaseConfigured, supabase, REQUIRED_SQL_SCHEMA, CURRENT_SQL_VERSION } from '../services/supabase';
import { UserRole, Class } from '../types';

// --- SUB-COMPONENTES DE PÁGINA ---

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [dbVersion, setDbVersion] = useState('');
  const [checkingVersion, setCheckingVersion] = useState(true);

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
          setDbVersion(data.value.version);
        } else {
          setDbVersion('v0.0.0'); // Assume desatualizado se não existir
        }
        setCheckingVersion(false);
      };
      checkVersion();
    } else {
        setCheckingVersion(false);
    }
  }, [user]);

  const needsSqlUpdate = user?.role === 'admin' && !checkingVersion && dbVersion !== CURRENT_SQL_VERSION;

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
                      A versão atual no Supabase é {dbVersion}.
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

// --- GESTÃO DE UTILIZADORES ---
const UsersManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Estado de Dados
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]); // Lista de Turmas
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
  const [inviteEmails, setInviteEmails] = useState(''); // TEXTAREA
  const [inviteRole, setInviteRole] = useState<UserRole>('aluno');
  const [inviteClassId, setInviteClassId] = useState<string>(''); // Seleção de Turma
  const [sendingInvite, setSendingInvite] = useState(false);

  // Estado de Ações
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const roles: {value: UserRole, label: string, color: string}[] = [
      { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-700' },
      { value: 'editor', label: 'Editor', color: 'bg-pink-100 text-pink-700' },
      { value: 'formador', label: 'Formador', color: 'bg-blue-100 text-blue-700' },
      { value: 'aluno', label: 'Aluno', color: 'bg-emerald-100 text-emerald-700' }
  ];

  // Fetch Users & Invites
  const fetchUsers = async () => {
      if (!isSupabaseConfigured) return;
      setLoading(true);
      try {
          // 0. Carregar Turmas para o dropdown
          const { data: classesData } = await supabase.from('classes').select('id, name').eq('status', 'active');
          setClasses(classesData || []);

          // 1. Query Perfis (Registados)
          // Tenta fazer o JOIN com classes. Se falhar (ex: SQL não atualizado), faz fallback
          let profilesData = [];
          try {
              let profilesQuery = supabase.from('profiles').select('*, classes(name)').order('created_at', { ascending: false });
              if (roleFilter !== 'all') profilesQuery = profilesQuery.eq('role', roleFilter);
              if (searchTerm) profilesQuery = profilesQuery.or(`email.ilike.%${searchTerm}%,student_number.eq.${!isNaN(Number(searchTerm)) ? searchTerm : -1}`);
              
              const { data, error } = await profilesQuery;
              if (error) throw error;
              profilesData = data;
          } catch (e) {
              console.warn("Falha ao buscar turmas no perfil (Provável falta de SQL). Tentando fallback simples.");
              let simpleQuery = supabase.from('profiles').select('*').order('created_at', { ascending: false });
              const { data } = await simpleQuery;
              profilesData = data || [];
          }

          // 2. Query Convites (Pendentes)
          let invitesData = [];
          try {
              let invitesQuery = supabase.from('user_invites').select('*, classes(name)').order('invited_at', { ascending: false });
              if (roleFilter !== 'all') invitesQuery = invitesQuery.eq('role', roleFilter);
              if (searchTerm) invitesQuery = invitesQuery.ilike('email', `%${searchTerm}%`);
              
              const { data, error } = await invitesQuery;
              if (error) throw error;
              invitesData = data;
          } catch (e) {
              console.warn("Falha ao buscar turmas nos convites. Tentando fallback simples.");
              let simpleInviteQuery = supabase.from('user_invites').select('*').order('invited_at', { ascending: false });
              const { data } = await simpleInviteQuery;
              invitesData = data || [];
          }
          
          // Formatar Convites para estrutura de User
          const formattedInvites = (invitesData || []).map((inv: any) => ({
             id: `invite_${inv.email}`, // Fake ID para a lista
             email: inv.email,
             full_name: 'Convite Pendente',
             role: inv.role,
             created_at: inv.invited_at,
             is_invite: true, // Flag identificadora
             avatar_url: null,
             student_number: null,
             classes: inv.classes // Join data
          }));

          // Merge: Convites primeiro, depois registados
          setUsers([...formattedInvites, ...(profilesData || [])]);

      } catch (err) {
          console.error("Erro fatal ao buscar utilizadores:", err);
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
          // Apenas seleciona utilizadores reais (com ID UUID) para ações em massa
          // Convites são geridos individualmente por segurança
          setSelectedIds(users.filter(u => !u.is_invite).map(u => u.id));
      }
  };

  const toggleSelectUser = (id: string, isInvite: boolean) => {
      // Impede seleção de convites para ações em massa
      if (isInvite) return; 

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

  // Single User/Invite Actions
  const handleSingleDelete = async (u: any) => {
      const msg = u.is_invite 
          ? `Deseja cancelar o convite para ${u.email}?`
          : `ATENÇÃO: Deseja eliminar o utilizador ${u.email}? Esta ação remove o acesso à plataforma.`;

      if (!confirm(msg)) return;
      setProcessing(true);
      
      try {
          if (u.is_invite) {
             // Deletar Convite
             const { error } = await supabase.from('user_invites').delete().eq('email', u.email);
             if (error) throw error;
          } else {
             // Deletar Utilizador Real
             const { error } = await supabase.rpc('bulk_delete_users', { user_ids: [u.id] });
             if (error) throw error;
          }
          
          await fetchUsers();
          // Remove from selection if selected
          if (selectedIds.includes(u.id)) {
              setSelectedIds(prev => prev.filter(uid => uid !== u.id));
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
               role: editingUser.role,
               class_id: editingUser.class_id || null // Update Class
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

  // Invite User (BULK & CLASS SUPPORT)
  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingInvite(true);

      // 1. Parse emails (Separados por vírgula, ponto e vírgula ou nova linha)
      const emailList = inviteEmails
          .split(/[\n,;]+/)
          .map(e => e.trim())
          .filter(e => e.length > 5 && e.includes('@')); // Validação básica

      if (emailList.length === 0) {
          alert("Por favor insira pelo menos um email válido.");
          setSendingInvite(false);
          return;
      }

      try {
          // Loop de convites (Nota: Idealmente seria um Bulk Insert RPC, mas para reutilizar a lógica existente fazemos loop)
          // Como o create_invite é um RPC atómico, fazemos Promise.all
          const promises = emailList.map(email => 
              supabase.rpc('create_invite', { 
                  email_input: email, 
                  role_input: inviteRole,
                  class_input: inviteClassId || null
              })
          );

          await Promise.all(promises);

          alert(`SUCESSO: ${emailList.length} emails autorizados na base de dados.`);
          
          setIsInviteOpen(false);
          setInviteEmails('');
          setInviteClassId('');
          await fetchUsers(); 
          
      } catch (rpcError: any) {
          console.error("Erro RPC:", rpcError);
          alert("Erro de conexão ao autorizar convites. " + rpcError.message);
      } finally {
          setSendingInvite(false);
      }
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
                    <Plus size={16} /> Adicionar Utilizadores
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
                        placeholder="Pesquisar por email ou Nº Aluno..." 
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
                                    {users.length > 0 && selectedIds.length === users.filter(u=>!u.is_invite).length ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>
                            </th>
                            <th className="py-3 px-4">Utilizador</th>
                            <th className="py-3 px-4">Turma / Estado</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Cargo</th>
                            <th className="py-3 px-4">Data Registo</th>
                            <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-8 text-slate-400">Nenhum utilizador encontrado.</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className={`hover:bg-indigo-50/30 transition-colors ${selectedIds.includes(u.id) ? 'bg-indigo-50/60' : ''} ${u.is_invite ? 'bg-amber-50/30' : ''}`}>
                                    <td className="py-3 pl-4">
                                        <button 
                                            onClick={() => toggleSelectUser(u.id, !!u.is_invite)} 
                                            className={`flex items-center ${selectedIds.includes(u.id) ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'} ${u.is_invite ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            disabled={u.is_invite}
                                        >
                                            {selectedIds.includes(u.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            {u.is_invite ? (
                                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shrink-0 border border-amber-200">
                                                    <Mail size={14} />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                                                    {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover"/> : (u.full_name?.[0] || u.email[0])}
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${u.is_invite ? 'text-amber-800 italic' : 'text-slate-800'}`}>
                                                    {u.full_name || 'Sem Nome'}
                                                </span>
                                                {/* ID Visível por baixo do nome */}
                                                {!u.is_invite && <span className="text-[10px] text-slate-400">#{u.student_number || '-'}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs">
                                        {u.is_invite ? (
                                            <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md w-fit">
                                                <Clock size={12} /> Pendente
                                            </span>
                                        ) : (
                                            u.classes?.name ? (
                                                <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md w-fit font-bold">
                                                    <GraduationCap size={12} /> {u.classes.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-[10px] italic">Sem Turma</span>
                                            )
                                        )}
                                        {/* Show class for invite if exists */}
                                        {u.is_invite && u.classes?.name && (
                                             <div className="mt-1 flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md w-fit text-[10px]">
                                                 <GraduationCap size={10} /> {u.classes.name}
                                             </div>
                                        )}
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
                                            {!u.is_invite && (
                                                <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleSingleDelete(u)}
                                                className={`p-1.5 rounded-lg transition-colors ${u.is_invite ? 'hover:bg-amber-50 text-amber-400 hover:text-amber-600' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}
                                                title={u.is_invite ? "Cancelar Convite" : "Eliminar Conta"}
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
                <span>Total: {users.length} (Registados: {users.filter(u => !u.is_invite).length}, Pendentes: {users.filter(u => u.is_invite).length})</span>
                <span>Dados do Supabase</span>
            </div>
        </GlassCard>

        {/* MODAL: AUTHORIZE USER (BULK) */}
        {isInviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <GlassCard className="w-full max-w-lg shadow-2xl border-white/80 bg-white/90">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Adicionar Utilizadores</h3>
                        <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800 flex items-start gap-2">
                            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                            <span>
                                Esta ação pré-regista os emails. Os utilizadores devem aceder ao site e colocar o seu email para definir a password.
                            </span>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Emails (Um ou vários)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea 
                                    required
                                    rows={4}
                                    value={inviteEmails}
                                    onChange={e => setInviteEmails(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-mono text-sm"
                                    placeholder={`exemplo@email.com\naluno2@email.com`}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 pl-1">Separe múltiplos emails com uma nova linha.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Turma (Opcional)</label>
                                <select 
                                    value={inviteClassId}
                                    onChange={e => setInviteClassId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Sem Turma</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsInviteOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                            <button 
                                type="submit" 
                                disabled={sendingInvite}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {sendingInvite ? <Loader2 className="animate-spin" size={18}/> : 'Adicionar Utilizadores'}
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
                        <div className="grid grid-cols-2 gap-4">
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
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Turma</label>
                                <select 
                                    value={editingUser.class_id || ''}
                                    onChange={e => setEditingUser({...editingUser, class_id: e.target.value || null})}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Sem Turma</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
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

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
       {/* Background gradient fixed */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
       </div>

      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 relative z-10 transition-all duration-300">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/courses" element={<CoursesManagement />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/classes" element={<ClassesManager />} />
          
          {/* Admin Routes */}
          {user.role === 'admin' && (
             <>
                <Route path="/sql" element={<SqlManager />} />
                <Route path="/site-content" element={<SiteContentEditor />} />
                <Route path="/permissions" element={<PermissionsManager />} />
                <Route path="/settings" element={<IntegrationsManager />} />
             </>
          )}

          {/* Student Routes */}
          <Route path="/materials" element={<MyMaterials />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};
