import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Key, ShieldCheck, AlertTriangle, Loader2, ChevronLeft } from 'lucide-react';

type LoginStep = 'EMAIL' | 'PASSWORD' | 'FIRST_ACCESS';

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
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirecionamento se já logado
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Tratamento de erros via URL
  useEffect(() => {
    if (location.state?.error) {
       setError(decodeURIComponent(location.state.error.replace(/\+/g, ' ')));
       // Limpar o estado para não mostrar o erro novamente num refresh
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
      
      if (!status.exists) {
        setError('Este email não está registado na plataforma.');
        setLoading(false);
        return;
      }

      if (status.is_password_set) {
        // Fluxo Normal: Utilizador já tem password
        setStep('PASSWORD');
      } else {
        // Fluxo Primeiro Acesso: Enviar OTP e pedir definição de password
        await signInWithOtp(email);
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
      // Redirecionamento acontece via useEffect quando o user muda
    } catch (err: any) {
      setError('Password incorreta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2B: Primeiro Acesso (OTP + Nova Password)
  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword.length < 6) {
        setError('A password deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
    }

    try {
      await completeFirstAccess(email, otp, newPassword);
      // Sucesso levará ao useEffect que redireciona para dashboard
    } catch (err: any) {
      console.error(err);
      setError('Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('EMAIL');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden transition-all duration-500 shadow-2xl border border-white/60">
        
        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30 transition-all duration-300">
            {step === 'EMAIL' && <Mail size={32} />}
            {step === 'PASSWORD' && <Lock size={32} />}
            {step === 'FIRST_ACCESS' && <ShieldCheck size={32} />}
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {step === 'EMAIL' && 'Bem-vindo'}
            {step === 'PASSWORD' && 'Olá de novo'}
            {step === 'FIRST_ACCESS' && 'Primeiro Acesso'}
          </h1>
          
          <p className="text-slate-500 mt-2 font-medium">
            {step === 'EMAIL' && 'Identifique-se para continuar.'}
            {step === 'PASSWORD' && <span className="break-all">Introduza a password para <br/> <span className="text-indigo-600">{email}</span></span>}
            {step === 'FIRST_ACCESS' && 'Configure a sua segurança.'}
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
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Profissional</label>
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

        {/* --- STEP 2B: FIRST ACCESS --- */}
        {step === 'FIRST_ACCESS' && (
            <form onSubmit={handleFirstAccessSubmit} className="relative z-10 space-y-5">
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800 leading-relaxed">
                    <p className="font-bold mb-1">Verificação de Segurança</p>
                    Enviámos um código temporário para <b>{email}</b>. Insira-o abaixo para definir a sua password definitiva.
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Código do Email (OTP)</label>
                  <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-center tracking-[0.5em] font-mono text-lg font-bold text-slate-800 placeholder-slate-300"
                      placeholder="000000"
                      required
                      autoComplete="one-time-code"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Definir Nova Password</label>
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
                      />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                    type="button"
                    onClick={resetFlow}
                    className="px-5 py-3.5 rounded-xl bg-white/50 hover:bg-white text-slate-600 font-semibold transition-colors border border-transparent hover:border-slate-200"
                    title="Cancelar"
                    >
                    <ChevronLeft size={24} />
                    </button>

                    <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                    {loading ? <Loader2 className="animate-spin" /> : 'Definir Password e Entrar'}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};