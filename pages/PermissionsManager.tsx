import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { GlassCard } from '../components/GlassCard';
import { Shield, UserCheck, Lock, AlertTriangle, Search, RefreshCw, Loader2 } from 'lucide-react';
import { UserRole } from '../types';

export const PermissionsManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrivilegedUsers();
  }, []);

  const fetchPrivilegedUsers = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
        // Buscar Admins e Formadores
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['admin', 'formador', 'editor'])
            .order('role', { ascending: true }); // admin first usually

        if (error) throw error;
        setUsers(data || []);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case 'admin': return <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">Admin</span>;
          case 'editor': return <span className="px-2 py-1 rounded bg-pink-100 text-pink-800 text-xs font-bold border border-pink-200">Editor</span>;
          case 'formador': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">Formador</span>;
          default: return <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold">User</span>;
      }
  };

  const getCapabilities = (role: UserRole) => {
      switch(role) {
          case 'admin': return "Acesso Total: Gestão de Utilizadores, SQL, Integrações, Cursos, Conteúdo.";
          case 'editor': return "Gestão de Conteúdo: Cursos, Alunos (Leitura), Dashboard.";
          case 'formador': return "Gestão de Cursos: Criar/Editar Cursos Próprios, Ver Materiais.";
          default: return "Acesso Limitado.";
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Auditoria de Permissões</h1>
                <p className="text-slate-500 mt-1">Visão geral dos utilizadores com acesso privilegiado.</p>
            </div>
            <button 
                onClick={fetchPrivilegedUsers}
                className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-6">
                <GlassCard title="Utilizadores Privilegiados">
                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">Nenhum utilizador encontrado.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-medium text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Cargo</th>
                                        <th className="px-4 py-3">Acesso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{u.full_name || 'N/A'}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                                            <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate" title={getCapabilities(u.role)}>
                                                {getCapabilities(u.role)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
             </div>

             <div className="space-y-6">
                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900">
                     <div className="flex items-center gap-2 font-bold mb-2">
                         <AlertTriangle size={20} className="text-amber-600" />
                         <span>Nota de Segurança</span>
                     </div>
                     <p className="text-sm leading-relaxed opacity-90">
                         Os cargos de <strong>Admin</strong> têm acesso total à base de dados SQL e configurações críticas.
                         Certifique-se que apenas pessoas de confiança possuem este nível de acesso.
                     </p>
                 </div>

                 <GlassCard title="Matriz de Acesso">
                     <ul className="space-y-4 text-sm">
                         <li className="flex gap-3">
                             <div className="mt-0.5"><Shield size={16} className="text-purple-600" /></div>
                             <div>
                                 <strong className="text-slate-800 block">Administrador</strong>
                                 <span className="text-slate-500">Acesso root, gestão SQL, configurações globais.</span>
                             </div>
                         </li>
                         <li className="flex gap-3">
                             <div className="mt-0.5"><UserCheck size={16} className="text-pink-600" /></div>
                             <div>
                                 <strong className="text-slate-800 block">Editor</strong>
                                 <span className="text-slate-500">Gestão de utilizadores e conteúdos (limitado).</span>
                             </div>
                         </li>
                         <li className="flex gap-3">
                             <div className="mt-0.5"><Lock size={16} className="text-blue-600" /></div>
                             <div>
                                 <strong className="text-slate-800 block">Formador</strong>
                                 <span className="text-slate-500">Criação de cursos e gestão dos seus alunos.</span>
                             </div>
                         </li>
                     </ul>
                 </GlassCard>
             </div>
        </div>
    </div>
  );
};