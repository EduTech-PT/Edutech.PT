import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { GlassCard } from '../components/GlassCard';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Link
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  
  // Estados para Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('');
  
  // Estados para Segurança
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de UI
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Carregar dados no mount
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
      setRole(user.role || 'aluno');
    }
  }, [user]);

  // Limpar mensagens após 3s
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isSupabaseConfigured) return;

    setLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      // Pequeno hack para atualizar o sidebar visualmente (na próxima versão idealmente usaríamos um contexto global de user update)
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As passwords não coincidem.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mínimo de 6 caracteres.' });
      return;
    }

    setLoadingSecurity(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password alterada com segurança.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao alterar password.' });
    } finally {
      setLoadingSecurity(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">O Meu Perfil</h1>
          <p className="text-slate-500 mt-1">Gerencie as suas informações pessoais e segurança.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-pulse ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: DADOS PESSOAIS */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard title="Informação Pessoal">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              <div className="flex items-center gap-6 pb-6 border-b border-white/40">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      fullName?.charAt(0) || user?.email?.charAt(0)
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                    <Camera size={14} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800">{fullName || 'Utilizador'}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1
                    ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      role === 'formador' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="O seu nome"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Email (Não editável)</label>
                  <div className="relative opacity-70 cursor-not-allowed">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">URL do Avatar</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm font-mono text-slate-600"
                      placeholder="https://..."
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Cole aqui um link direto para uma imagem (ex: GitHub, Gravatar).</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loadingProfile || !isSupabaseConfigured}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Guardar Alterações
                </button>
              </div>

            </form>
          </GlassCard>
        </div>

        {/* COLUNA DIREITA: SEGURANÇA */}
        <div className="space-y-6">
          <GlassCard title="Segurança">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-xs text-amber-800 mb-4">
                <Shield className="shrink-0 text-amber-600" size={16} />
                <p>Recomendamos o uso de uma password forte com letras, números e símbolos.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Nova Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Confirmar Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loadingSecurity || !isSupabaseConfigured || !newPassword}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSecurity ? <Loader2 className="animate-spin" size={18} /> : 'Atualizar Password'}
              </button>
            </form>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};