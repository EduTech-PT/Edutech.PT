import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email);
      setEmailSent(true);
    } catch (error) {
      alert('Ocorreu um erro ao enviar o link de acesso. Verifique a consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6 mx-auto">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifique o seu email</h2>
          <p className="text-slate-600 mb-6">
            Enviámos um link de acesso seguro para <br/>
            <span className="font-semibold text-indigo-600">{email}</span>
          </p>
          <div className="p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800 border border-indigo-100 mb-6">
            <p>Clique no link recebido para entrar na plataforma automaticamente.</p>
          </div>
          <button 
            onClick={() => setEmailSent(false)}
            className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
          >
            Voltar e tentar outro email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Bem-vindo</h1>
          <p className="text-slate-500 mt-2">Aceda à plataforma EduTech PT</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-slate-800 placeholder-slate-400"
                placeholder="exemplo@edutech.pt"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'A processar...' : 'Entrar com Magic Link'}
            {!isSubmitting && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Login seguro via Supabase Auth</p>
        </div>
      </div>
    </div>
  );
};