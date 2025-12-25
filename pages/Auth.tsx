
import React, { useState } from 'react';
import { auth, db } from '../services/firebaseService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

type AuthView = 'login' | 'signup' | 'forgot';

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(db, 'users/' + userCredential.user.uid + '/profile'), {
          email: email,
          createdAt: Date.now(),
          isAdmin: email === 'aryan029298@gmail.com',
          status: 'Free User'
        });
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset link sent to your email!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-500/20">BF</div>
          <h2 className="text-2xl font-black text-white">
            {view === 'login' && 'Welcome Back'}
            {view === 'signup' && 'Join BrandFlow'}
            {view === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-slate-500 text-xs mt-2 font-medium uppercase tracking-widest">
            {view === 'login' && 'Partner Account Login'}
            {view === 'signup' && 'Start Your AI Journey'}
            {view === 'forgot' && 'Account Recovery'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Email Address</p>
            <input 
              type="email" 
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              placeholder="name@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {view !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</p>
                {view === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setMessage(''); }}
                    className="text-[9px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3">
              <i className="fas fa-circle-exclamation text-rose-500 text-xs"></i>
              <p className="text-rose-500 text-[10px] font-bold leading-tight">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
              <i className="fas fa-circle-check text-emerald-500 text-xs"></i>
              <p className="text-emerald-500 text-[10px] font-bold leading-tight">{message}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className={`fas ${view === 'forgot' ? 'fa-paper-plane' : 'fa-unlock-keyhole'}`}></i>}
            {view === 'login' && 'Sign In'}
            {view === 'signup' && 'Create Partner Account'}
            {view === 'forgot' && 'Send Recovery Link'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col gap-3">
          {view === 'forgot' ? (
            <button 
              onClick={() => { setView('login'); setError(''); setMessage(''); }}
              className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Login
            </button>
          ) : (
            <button 
              onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
              className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
