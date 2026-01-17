import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Key, ShieldCheck, AlertTriangle, Loader2, ChevronLeft, CheckCircle2, Hash, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

type LoginStep = 'EMAIL' | 'PASSWORD' | 'FIRST_ACCESS' | 'RECOVERY_SET_PASSWORD';

export const Login: React.FC = () => {
  const { checkUserStatus, signInWithPassword, signInWithOtp, completeFirstAccess, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados do Formulário
  const [step, setStep] = useState<LoginStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Estado para o nome no primeiro acesso
  
  // Estado de Branding
  const [branding, setBranding] = useState({ logoUrl: '', siteName: '' });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Branding
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.from('system_integrations').select('value').eq('key', 'site_branding').single()
        .then(({ data }) => {
           if (data?.value) setBranding(data.value);
        });
    }
  }, []);

  // Redirecionamento se já logado
  useEffect(() => {
    // Se o utilizador já estiver logado, redireciona
    if (user) {
        // Se estivermos em modo de recuperação (vindo do Link de Reset), ficamos aqui para mudar a pass
        if (location.state?.recoveryMode) {
            setStep('RECOVERY_SET_PASSWORD');
            if (user.email) setEmail(user.email);
        } else {
            navigate('/dashboard');
        }
    }
  }, [user, navigate, location]);

  // Tratamento de erros via URL
  useEffect(() => {
    if (location.state?.error) {
       setError(decodeURIComponent(location.state.error.replace(/\+/g, ' ')));
       window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Passo 1: Verificar Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const status = await checkUserStatus(email);
      
      // CASO 1: Email não existe E não foi convidado
      if (!status.exists && !status.is_invited) {
        // EXCEÇÃO DE BOOTSTRAP (Admin Inicial - Hardcoded para permitir primeiro acesso)
        if (email.toLowerCase() === 'edutechpt@hotmail.com') {
           try {
             await signInWithOtp(email, true); // true = allow creation
             setStep('FIRST_ACCESS');
           } catch (otpErr: any) {
             console.error(otpErr);
             setError('Erro ao enviar email de verificação.');
           }
           setLoading(false);
           return;
        }

        setError('Email sem acesso à plataforma.');
        setLoading(false);
        return;
      }

      // CASO 2: Utilizador existe e tem password -> Login normal
      if (status.exists && status.is_password_set) {
        setStep('PASSWORD');
      
      // CASO 3: Utilizador existe MAS não tem password -> Primeiro Acesso
      } else if (status.exists && !status.is_password_set) {
        await signInWithOtp(email, false); // false = não cria novo, usa existente
        setStep('FIRST_ACCESS');
      
      // CASO 4: Utilizador NÃO existe MAS foi convidado -> Criação de Conta
      } else if (!status.exists && status.is_invited) {
        await signInWithOtp(email, true); // true = cria novo user auth
        setStep('FIRST_ACCESS');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao verificar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2A: Login com Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithPassword(email, password);
    } catch (err: any) {
      setError('Password incorreta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2B: Primeiro Acesso (Via Código OTP)
  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword.length < 6) {
        setError('A password deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
    }

    if (otp.length < 6) {
        setError('O código deve ter 6 dígitos.');
        setLoading(false);
        return;
    }

    if (fullName.trim().length < 2) {
        setError('Por favor, introduza o seu nome completo.');
        setLoading(false);
        return;
    }

    try {
      // Agora passamos também o fullName
      await completeFirstAccess(email, otp, newPassword, fullName);
    } catch (err: any) {
      console.error(err);
      setError('Código inválido ou expirado. Verifique o email mais recente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Passo Especial: Recuperação de Password (Reset)
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Na recuperação não forçamos a mudança de nome
        await completeFirstAccess(user?.email || email, 'RECOVERY_MODE', newPassword);
        navigate('/dashboard');
    } catch (err: any) {
        setError('Erro ao atualizar password. Tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('EMAIL');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setFullName('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden transition-all duration-500 shadow-2xl border border-white/60">
        
        {/* BRANDING HEADER (LOGO DINÂMICO) */}
        {branding.logoUrl && (
            <div className="flex flex-col items-center justify-center mb-6 pt-2">
                <img src={branding.logoUrl} alt="Logo" className="h-12 object-contain mb-2" />
                {branding.siteName && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{branding.siteName}</span>}
            </div>
        )}

        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30 transition-all duration-300">
            {step === 'EMAIL' && <Mail size={32} />}
            {step === 'PASSWORD' && <Lock size={32} />}
            {step === 'FIRST_ACCESS' && <Hash size={32} />}
            {step === 'RECOVERY_SET_PASSWORD' && <Key size={32} />}
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {step === 'EMAIL' && 'Bem-vindo'}
            {step === 'PASSWORD' && 'Olá de novo'}
            {step === 'FIRST_ACCESS' && 'Primeiro Acesso'}
            {step === 'RECOVERY_SET_PASSWORD' && 'Nova Password'}
          </h1>
          
          <p className="text-slate-500 mt-2 font-medium">
            {step === 'EMAIL' && 'Identifique-se para continuar.'}
            {step === 'PASSWORD' && <span className="break-all">Introduza a password para <br/> <span className="text-indigo-600">{email}</span></span>}
            {step === 'FIRST_ACCESS' && 'Para sua segurança, defina o seu nome e password.'}
            {step === 'RECOVERY_SET_PASSWORD' && 'Defina a sua nova segurança.'}
          </p>
        </div>

        {error && (
          <div className="relative z-10 mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-pulse">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* --- STEP 1: EMAIL --- */}
        {step === 'EMAIL' && (
          <form onSubmit={handleEmailSubmit} className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="exemplo@edutech.pt"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Continuar'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        )}

        {/* --- STEP 2A: PASSWORD --- */}
        {step === 'PASSWORD' && (
          <form onSubmit={handlePasswordSubmit} className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">Esqueceu-se da password?</button>
              </div>
            </div>

            <div className="flex gap-3">
                <button
                type="button"
                onClick={resetFlow}
                className="px-5 py-3.5 rounded-xl bg-white/50 hover:bg-white text-slate-600 font-semibold transition-colors border border-transparent hover:border-slate-200"
                title="Voltar"
                >
                <ChevronLeft size={24} />
                </button>
                <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                {loading ? <Loader2 className="animate-spin" /> : 'Entrar na Plataforma'}
                </button>
            </div>
          </form>
        )}

        {/* --- STEP 2B: FIRST ACCESS (OTP + NAME + PASSWORD) --- */}
        {step === 'FIRST_ACCESS' && (
            <form onSubmit={handleFirstAccessSubmit} className="relative z-10 space-y-4">
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed text-center mb-2">
                    <p className="font-bold mb-1">Confirmação de Identidade</p>
                    O Supabase enviou um código de 6 dígitos para o seu email. Insira-o abaixo e defina o seu nome e password.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 ml-1">Código de Confirmação (Email)</label>
                  <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 outline-none text-center tracking-[0.5em] font-mono font-bold text-slate-800 placeholder-slate-300 text-xl"
                      placeholder="000000"
                      autoComplete="one-time-code"
                      autoFocus
                  />
                </div>

                {/* NOVO CAMPO: NOME COMPLETO */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 ml-1">Nome Completo</label>
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-medium"
                        placeholder="Ex: João Silva"
                        required
                        minLength={2}
                      />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 ml-1">Definir Password</label>
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Key size={18} />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-medium"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                    type="button"
                    onClick={resetFlow}
                    className="px-5 py-3 rounded-xl bg-white/50 hover:bg-white text-slate-600 font-semibold transition-colors border border-transparent hover:border-slate-200"
                    title="Cancelar"
                    >
                    <ChevronLeft size={24} />
                    </button>

                    <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirmar e Criar Conta'}
                    </button>
                </div>
            </form>
        )}

         {/* --- STEP 3: RECOVERY SET PASSWORD --- */}
         {step === 'RECOVERY_SET_PASSWORD' && (
            <form onSubmit={handleRecoverySubmit} className="relative z-10 space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                    <span>Identidade confirmada com sucesso. Defina a sua nova password.</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Nova Password</label>
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <Key size={20} />
                      </div>
                      <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-medium"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      autoFocus
                      />
                  </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Atualizar Password'}
                </button>
            </form>
         )}

      </div>
    </div>
  );
};