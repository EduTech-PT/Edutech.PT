import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Key, ShieldCheck, AlertTriangle, Loader2, ChevronLeft, CheckCircle2, Hash, User, RefreshCw, Clock, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Novos passos divididos
type LoginStep = 'EMAIL' | 'PASSWORD' | 'FIRST_ACCESS_OTP' | 'FIRST_ACCESS_DETAILS' | 'RECOVERY_SET_PASSWORD';

export const Login: React.FC = () => {
  const { checkUserStatus, signInWithPassword, signInWithOtp, verifyFirstAccessCode, finalizeFirstAccess, completeFirstAccess, enterRescueMode, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados do Formulário
  const [step, setStep] = useState<LoginStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Estado para o nome no primeiro acesso
  
  // Estado de Branding e Configuração
  const [branding, setBranding] = useState({ logoUrl: '' });
  const [authConfig, setAuthConfig] = useState({ resendTimerSeconds: 60 }); // Default 60s
  
  // Estado de Emergência
  const [showRescueButton, setShowRescueButton] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0); // Timer para reenvio

  // Fetch Branding & Configs
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Carregar Branding
      supabase.from('system_integrations').select('value').eq('key', 'site_branding').single()
        .then(({ data }) => {
           if (data?.value) setBranding(data.value);
        });

      // Carregar Configuração de Segurança (Rate Limit)
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

  // Lógica de Redirecionamento (CRÍTICA)
  // Só redireciona se o user estiver logado E tiver password definida
  useEffect(() => {
    if (user) {
        if (location.state?.recoveryMode) {
            setStep('RECOVERY_SET_PASSWORD');
            if (user.email) setEmail(user.email);
        } else if (user.is_password_set) {
            // Se já tem password, pode entrar
            navigate('/dashboard');
        } else {
            // Se está logado mas não tem password (ex: acabou de validar OTP), 
            // força o ecrã de detalhes
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

  const handleRescueLogin = () => {
      enterRescueMode();
      navigate('/dashboard');
  };

  // Passo 1: Verificar Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setShowRescueButton(false);

    try {
      const status = await checkUserStatus(email);
      
      // CASO 1: Email não existe E não foi convidado
      if (!status.exists && !status.is_invited) {
        // EXCEÇÃO DE BOOTSTRAP (Admin Inicial)
        // Se a verificação falhar (DB vazia), tentamos criar via OTP
        if (email.toLowerCase() === 'edutechpt@hotmail.com') {
           try {
             await signInWithOtp(email, true);
             setStep('FIRST_ACCESS_OTP');
             setResendTimer(authConfig.resendTimerSeconds);
           } catch (otpErr: any) {
             console.error(otpErr);
             if (otpErr.message?.includes('Rate limit') || otpErr.message?.includes('confirmation email') || otpErr.message?.includes('security purposes')) {
                 setError('Limite de segurança do Supabase atingido. Tente o modo de resgate.');
                 setShowRescueButton(true);
             } else {
                 setError('Erro ao enviar email. Tente o modo de resgate.');
                 setShowRescueButton(true);
             }
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
      
      // CASO 3: Utilizador existe MAS não tem password (ou Novo Convite) -> Primeiro Acesso (Pedir OTP)
      } else {
        const createNew = !status.exists && status.is_invited; // Se não existe mas foi convidado, cria
        await signInWithOtp(email, createNew); 
        setStep('FIRST_ACCESS_OTP');
        setResendTimer(authConfig.resendTimerSeconds);
      }

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Rate limit') || err.message?.includes('confirmation email') || err.message?.includes('security purposes')) {
         setError('Limite de tentativas excedido (Supabase Free Tier).');
         if (email.toLowerCase() === 'edutechpt@hotmail.com') {
             setShowRescueButton(true);
         }
      } else {
         setError(err.message || 'Erro ao verificar email. Tente novamente.');
      }
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

  // Passo 2A-ALT: Recuperar Password (Esqueceu-se)
  const handleForgotPassword = async () => {
      setError(null);
      setLoading(true);
      setShowRescueButton(false);
      try {
          const isBootstrapAdmin = email.toLowerCase() === 'edutechpt@hotmail.com';
          await signInWithOtp(email, isBootstrapAdmin);
          setStep('FIRST_ACCESS_OTP');
          setResendTimer(authConfig.resendTimerSeconds);
      } catch (err: any) {
          console.error(err);
          setError('Limite de envios atingido. Aguarde alguns minutos.');
          if (email.toLowerCase() === 'edutechpt@hotmail.com') {
               setShowRescueButton(true);
          }
      } finally {
          setLoading(false);
      }
  };

  // Reenviar Código (Dentro do OTP Step)
  const handleResendCode = async () => {
      if (resendTimer > 0) return;
      
      setError(null);
      setLoading(true);
      try {
          await signInWithOtp(email, false); // false porque o user já deve existir ou estar convidado nesta fase
          setResendTimer(authConfig.resendTimerSeconds); // Reset timer
          setError(null); // Limpar erros se houver
          alert("Novo código enviado!");
      } catch (err: any) {
          console.error(err);
          setError('Limite atingido.');
          if (email.toLowerCase() === 'edutechpt@hotmail.com') {
              setShowRescueButton(true);
          }
      } finally {
          setLoading(false);
      }
  };

  // Passo 2B-1: Validar OTP Apenas
  const handleOtpSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      if (otp.length < 6) {
          setError('O código deve ter 6 dígitos.');
          setLoading(false);
          return;
      }

      try {
          await verifyFirstAccessCode(email, otp);
          // O AuthContext vai detetar o login e o useEffect acima vai mudar para FIRST_ACCESS_DETAILS
      } catch (err: any) {
          console.error(err);
          setError('Código inválido ou expirado.');
          setLoading(false);
      }
  };

  // Passo 2B-2: Definir Detalhes (Nome e Pass)
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
      // Exibe a mensagem real do erro para facilitar o debug
      setError(err.message || 'Erro ao guardar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Passo Especial: Recuperação de Password (Reset)
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
    setResendTimer(0);
    setShowRescueButton(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden transition-all duration-500 shadow-2xl border border-white/60">
        
        {/* BRANDING HEADER (LOGO + NOME) */}
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
          <div className="relative z-10 mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col items-start gap-3 text-red-700 text-sm animate-pulse shadow-sm">
            <div className="flex gap-2">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
            </div>
            
            {showRescueButton && (
                <button 
                    type="button"
                    onClick={handleRescueLogin}
                    className="w-full mt-2 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                    <Shield size={14} /> Entrar em Modo de Resgate (Admin)
                </button>
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
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                >
                  Esqueceu-se ou não tem password?
                </button>
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

        {/* --- STEP 2B-1: OTP ONLY --- */}
        {step === 'FIRST_ACCESS_OTP' && (
            <form onSubmit={handleOtpSubmit} className="relative z-10 space-y-4">
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed text-center mb-2">
                    Enviamos um código de verificação para <strong>{email}</strong>.
                    <br/>Verifique também a pasta de Spam.
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-end mb-1">
                      <label className="text-xs font-semibold text-slate-700 ml-1">Código de Confirmação</label>
                      <button 
                        type="button" 
                        onClick={handleResendCode}
                        disabled={resendTimer > 0 || loading}
                        className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800 cursor-pointer'}`}
                      >
                         {resendTimer > 0 ? (
                             <>
                                <Clock size={10} /> Reenviar em {resendTimer}s
                             </>
                         ) : (
                             <>
                                <RefreshCw size={10} /> Reenviar Código
                             </>
                         )}
                      </button>
                  </div>
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
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                    {loading ? <Loader2 className="animate-spin" /> : 'Validar Código'}
                    </button>
                </div>
            </form>
        )}

        {/* --- STEP 2B-2: DETAILS (NAME + PASS) --- */}
        {step === 'FIRST_ACCESS_DETAILS' && (
             <form onSubmit={handleDetailsSubmit} className="relative z-10 space-y-4 animate-in fade-in slide-in-from-right-8">
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Código validado com sucesso.
                </div>
                
                {/* NOME COMPLETO */}
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
                        autoFocus
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Concluir Registo'}
                </button>
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