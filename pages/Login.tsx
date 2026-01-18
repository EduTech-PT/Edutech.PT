import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Key, AlertTriangle, Loader2, ChevronLeft, CheckCircle2, Hash, User, RefreshCw, Clock, Settings, HelpCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

type LoginStep = 'EMAIL' | 'PASSWORD' | 'FIRST_ACCESS_OTP' | 'FIRST_ACCESS_DETAILS' | 'RECOVERY_SET_PASSWORD';

export const Login: React.FC = () => {
  const { checkUserStatus, signInWithPassword, signInWithOtp, verifyFirstAccessCode, finalizeFirstAccess, completeFirstAccess, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados do Formulário
  const [step, setStep] = useState<LoginStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Estado de Branding e Configuração
  const [branding, setBranding] = useState({ logoUrl: '' });
  const [authConfig, setAuthConfig] = useState({ resendTimerSeconds: 60 });
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Alterado para ReactNode para permitir listas e formatação
  const [errorDetail, setErrorDetail] = useState<React.ReactNode | null>(null); 
  const [resendTimer, setResendTimer] = useState(0);

  // Fetch Branding & Configs
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.from('system_integrations').select('value').eq('key', 'site_branding').single()
        .then(({ data }) => {
           if (data?.value) setBranding(data.value);
        });

      supabase.from('system_integrations').select('value').eq('key', 'auth_config').single()
        .then(({ data }) => {
           if (data?.value?.resendTimerSeconds) {
               setAuthConfig(prev => ({ ...prev, resendTimerSeconds: parseInt(data.value.resendTimerSeconds) }));
           }
        });
    }
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Lógica de Redirecionamento
  useEffect(() => {
    if (user) {
        if (location.state?.recoveryMode) {
            setStep('RECOVERY_SET_PASSWORD');
            if (user.email) setEmail(user.email);
        } else if (user.is_password_set) {
            navigate('/dashboard');
        } else {
            setStep('FIRST_ACCESS_DETAILS');
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

  const handleSmtpError = (err: any) => {
      const msg = (err.message || '').toLowerCase();
      const code = err.status || 0;
      
      console.error("Login Error:", err);

      // Erro 550 / Sender Rejected
      if (msg.includes('550') || msg.includes('sender address rejected') || msg.includes('error sending confirmation email')) {
          setError('Erro SMTP (550): Resend bloqueou o envio.');
          setErrorDetail(
            <div className="space-y-2 text-left">
                <p>O Supabase está a enviar dados "antigos" para o Resend.</p>
                
                <div className="bg-red-100/50 p-2 rounded border border-red-200 mt-2">
                    <p className="font-bold text-[11px] uppercase text-red-800 mb-1">Solução Obrigatória (Reset):</p>
                    <ol className="list-decimal list-inside text-[11px] space-y-1 text-red-900">
                        <li>Vá a <strong>Settings &gt; Auth &gt; SMTP Settings</strong>.</li>
                        <li><strong>DESLIGUE</strong> a opção "Enable Custom SMTP" e clique <strong>Save</strong>.</li>
                        <li>Aguarde 5 segundos.</li>
                        <li><strong>VOLTE A LIGAR</strong> a opção e clique <strong>Save</strong> novamente.</li>
                    </ol>
                    <p className="text-[10px] italic mt-1 text-red-700">Isto limpa a cache interna do Supabase.</p>
                </div>
                
                <p className="text-[10px] opacity-75 font-mono pt-1 mt-1 truncate">
                   Log: {err.message}
                </p>
            </div>
          );
          return;
      }

      if (msg.includes('rate limit') || msg.includes('too many requests') || code === 429) {
          setError('Limite de tentativas excedido.');
          setErrorDetail('O Supabase gratuito limita o envio de emails. Aguarde uma hora ou verifique o Custom SMTP.');
          return;
      }

      setError('Erro de autenticação.');
      setErrorDetail(err.message || 'Ocorreu um erro desconhecido.');
  };

  // Passo 1: Verificar Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetail(null);
    setLoading(true);

    try {
      const status = await checkUserStatus(email);
      
      // CASO 1: Email não existe E não foi convidado
      if (!status.exists && !status.is_invited) {
        // EXCEÇÃO ADMIN: Se for o admin inicial, tenta enviar OTP para criar a conta
        if (email.toLowerCase() === 'edutechpt@hotmail.com') {
           try {
             await signInWithOtp(email, true);
             setStep('FIRST_ACCESS_OTP');
             setResendTimer(authConfig.resendTimerSeconds);
           } catch (otpErr: any) {
             handleSmtpError(otpErr);
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
      
      // CASO 3: Primeiro Acesso (Sem Password)
      } else {
        const createNew = !status.exists && status.is_invited;
        await signInWithOtp(email, createNew); 
        setStep('FIRST_ACCESS_OTP');
        setResendTimer(authConfig.resendTimerSeconds);
      }

    } catch (err: any) {
      handleSmtpError(err);
    } finally {
      setLoading(false);
    }
  };

  // Passo 2A: Login com Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetail(null);
    setLoading(true);
    try {
      await signInWithPassword(email, password);
    } catch (err: any) {
      setError('Password incorreta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2A-ALT: Recuperar Password
  const handleForgotPassword = async () => {
      setError(null);
      setErrorDetail(null);
      setLoading(true);
      try {
          const isBootstrapAdmin = email.toLowerCase() === 'edutechpt@hotmail.com';
          await signInWithOtp(email, isBootstrapAdmin);
          setStep('FIRST_ACCESS_OTP');
          setResendTimer(authConfig.resendTimerSeconds);
      } catch (err: any) {
          handleSmtpError(err);
      } finally {
          setLoading(false);
      }
  };

  // Reenviar Código
  const handleResendCode = async () => {
      if (resendTimer > 0) return;
      setError(null);
      setErrorDetail(null);
      setLoading(true);
      try {
          await signInWithOtp(email, false);
          setResendTimer(authConfig.resendTimerSeconds);
          alert("Novo código enviado!");
      } catch (err: any) {
          handleSmtpError(err);
      } finally {
          setLoading(false);
      }
  };

  // Passo 2B-1: Validar OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setErrorDetail(null);
      setLoading(true);

      if (otp.length < 6) {
          setError('O código deve ter 6 dígitos.');
          setLoading(false);
          return;
      }

      try {
          await verifyFirstAccessCode(email, otp);
      } catch (err: any) {
          console.error(err);
          setError('Código inválido ou expirado.');
          setLoading(false);
      }
  };

  // Passo 2B-2: Definir Detalhes
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword.length < 6) {
        setError('A password deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
    }
    if (fullName.trim().length < 2) {
        setError('Por favor, introduza o seu nome completo.');
        setLoading(false);
        return;
    }

    try {
      await finalizeFirstAccess(newPassword, fullName);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao guardar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Passo Especial: Recuperação
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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
    setErrorDetail(null);
    setResendTimer(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden transition-all duration-500 shadow-2xl border border-white/60">
        
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center gap-3">
                {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">E</div>
                )}
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">EduTech PT</h1>
            </div>
        </div>

        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30 transition-all duration-300">
            {step === 'EMAIL' && <Mail size={32} />}
            {step === 'PASSWORD' && <Lock size={32} />}
            {(step === 'FIRST_ACCESS_OTP' || step === 'FIRST_ACCESS_DETAILS') && <Hash size={32} />}
            {step === 'RECOVERY_SET_PASSWORD' && <Key size={32} />}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {step === 'EMAIL' && 'Bem-vindo'}
            {step === 'PASSWORD' && 'Olá de novo'}
            {step === 'FIRST_ACCESS_OTP' && 'Confirmação'}
            {step === 'FIRST_ACCESS_DETAILS' && 'Configuração'}
            {step === 'RECOVERY_SET_PASSWORD' && 'Nova Password'}
          </h2>
          
          <p className="text-slate-500 mt-2 font-medium">
            {step === 'EMAIL' && 'Identifique-se para continuar.'}
            {step === 'PASSWORD' && <span className="break-all">Introduza a password para <br/> <span className="text-indigo-600">{email}</span></span>}
            {step === 'FIRST_ACCESS_OTP' && 'Introduza o código enviado para o seu email.'}
            {step === 'FIRST_ACCESS_DETAILS' && 'Defina os seus dados de acesso.'}
            {step === 'RECOVERY_SET_PASSWORD' && 'Defina a sua nova segurança.'}
          </p>
        </div>

        {error && (
          <div className="relative z-10 mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col items-start gap-2 text-red-700 text-sm animate-pulse shadow-sm">
            <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="shrink-0" size={18} />
                <span>{error}</span>
            </div>
            {errorDetail && (
                <div className="text-xs text-red-600 bg-red-100/50 p-3 rounded w-full border border-red-200">
                    <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Como resolver:</p>
                    {errorDetail}
                </div>
            )}
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
                  placeholder="exemplo@edutechpt.com"
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
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                      Esqueceu-se da password?
                  </button>
              </div>
            </div>

            <div className="space-y-3">
                <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                {!loading && <ArrowRight size={20} />}
                </button>
                
                <button
                type="button"
                onClick={resetFlow}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                <ChevronLeft size={18} /> Voltar
                </button>
            </div>
          </form>
        )}

        {/* --- STEP 2B: OTP --- */}
        {step === 'FIRST_ACCESS_OTP' && (
            <form onSubmit={handleOtpSubmit} className="relative z-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Código de Verificação</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <Hash size={20} />
                        </div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium tracking-[0.5em] text-center"
                            placeholder="000000"
                            maxLength={6}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="text-center">
                        {resendTimer > 0 ? (
                            <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                <Clock size={12}/> Reenviar código em {resendTimer}s
                            </span>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleResendCode} 
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto"
                            >
                                <RefreshCw size={12} /> Reenviar Código
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Verificar Código'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={resetFlow}
                        disabled={loading}
                        className="w-full py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft size={18} /> Voltar
                    </button>
                </div>
            </form>
        )}

        {/* --- STEP 3: DETAILS --- */}
        {step === 'FIRST_ACCESS_DETAILS' && (
            <form onSubmit={handleDetailsSubmit} className="relative z-10 space-y-6">
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-semibold text-slate-700 ml-1">Nome Completo</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
                                placeholder="João Silva"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700 ml-1">Definir Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Key size={20} />
                            </div>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Concluir Registo'}
                    {!loading && <CheckCircle2 size={20} />}
                </button>
            </form>
        )}

        {/* --- STEP 4: RECOVERY --- */}
        {step === 'RECOVERY_SET_PASSWORD' && (
             <form onSubmit={handleRecoverySubmit} className="relative z-10 space-y-6">
                 <div>
                    <label className="text-sm font-semibold text-slate-700 ml-1">Nova Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <Key size={20} />
                        </div>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Alterar Password'}
                    {!loading && <CheckCircle2 size={20} />}
                </button>
             </form>
        )}

      </div>
    </div>
  );
};