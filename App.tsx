
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import ContentEngine from './pages/ContentEngine';
import BusinessSaaS from './pages/BusinessSaaS';
import Academy from './pages/Academy';
import HealthDashboard from './pages/HealthDashboard';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import { auth, db } from './services/firebaseService';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const GlobalSearch = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!isOpen || !user) return;
    
    const searchData: any[] = [];
    
    const unsubHistory = onValue(ref(db, `users/${user.uid}/history`), (snap) => {
      const data = snap.val();
      if (data) Object.values(data).forEach((item: any) => searchData.push({ ...item, pillar: 'Branding', icon: 'fa-pen-nib', path: '/content' }));
    });
    const unsubBusiness = onValue(ref(db, `users/${user.uid}/businessLog`), (snap) => {
      const data = snap.val();
      if (data) Object.values(data).forEach((item: any) => searchData.push({ ...item, prompt: item.summary, pillar: 'Business', icon: 'fa-briefcase', path: '/business' }));
    });
    const unsubAcademy = onValue(ref(db, `users/${user.uid}/courses`), (snap) => {
      const data = snap.val();
      if (data) Object.values(data).forEach((item: any) => searchData.push({ ...item, prompt: item.courseTitle, pillar: 'Academy', icon: 'fa-graduation-cap', path: '/academy' }));
    });

    const filterResults = () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const filtered = searchData.filter(item => 
        (item.prompt || item.title || item.summary || "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setResults(filtered);
    };

    filterResults();
    return () => {
      unsubHistory();
      unsubBusiness();
      unsubAcademy();
    };
  }, [query, isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24">
      <div className="w-full max-w-2xl space-y-6">
        <div className="relative group">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"></i>
          <input 
            autoFocus
            type="text"
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl h-14 sm:h-16 pl-14 pr-16 text-white outline-none focus:border-blue-500/50 transition-all text-base sm:text-lg shadow-2xl"
            placeholder="Search your AI cloud..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">Esc</button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[70vh] no-scrollbar pb-10">
          {results.length > 0 ? (
            results.map((res, idx) => (
              <div 
                key={idx}
                onClick={() => { navigate(res.path); onClose(); }}
                className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 hover:bg-slate-800/60 hover:border-blue-500/30 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-blue-400 shrink-0">
                  <i className={`fas ${res.icon} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest block mb-1">{res.pillar}</span>
                  <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white">{res.prompt || res.title || res.courseTitle}</p>
                </div>
                <i className="fas fa-arrow-right text-[10px] text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
              </div>
            ))
          ) : query ? (
            <div className="text-center py-16">
              <i className="fas fa-ghost text-4xl text-slate-800 mb-4 block"></i>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Zero matching assets found</p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Quick Commands</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => { navigate('/content'); onClose(); }} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 text-left hover:border-blue-500/30 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><i className="fas fa-pen-nib"></i></div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">New Branding</p>
                </button>
                <button onClick={() => { navigate('/academy'); onClose(); }} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 text-left hover:border-emerald-500/30 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><i className="fas fa-graduation-cap"></i></div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Start Academy</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SubscriptionModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) => {
  const [step, setStep] = useState<'pick' | 'pay'>('pick');
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: number} | null>(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (utr.length < 12) return alert("Please enter a valid 12-digit UTR number");
    setSubmitting(true);
    try {
      await set(ref(db, `pendingPayments/${user.uid}`), {
        uid: user.uid,
        email: user.email,
        plan: selectedPlan?.name,
        price: selectedPlan?.price,
        utr: utr,
        timestamp: Date.now(),
        status: 'pending'
      });
      alert("Payment submitted! Your plan will be activated after admin verification.");
      onClose();
    } catch (e) {
      alert("Error submitting payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const qrImageUrl = "https://lh3.googleusercontent.com/d/1B30uFJK2jmQ7HVOEPKFzwL8l54GUzO2I";

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 relative animate-in zoom-in-95 duration-300 my-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors h-10 w-10 flex items-center justify-center"><i className="fas fa-times text-xl"></i></button>
        
        {step === 'pick' ? (
          <div className="space-y-8 pt-4">
            <div className="text-center">
              <h3 className="text-2xl sm:text-3xl font-black text-white italic">Upgrade Power</h3>
              <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-[0.3em]">Select Your Tier</p>
            </div>
            
            <div className="space-y-4">
              <div 
                onClick={() => setSelectedPlan({name: 'Pro', price: 99})}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-95 ${selectedPlan?.name === 'Pro' ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-lg text-white">Pro Pack</span>
                  <span className="text-blue-400 font-black">₹99/mo</span>
                </div>
                <ul className="text-[9px] text-slate-400 space-y-2 font-bold uppercase tracking-wider">
                  <li><i className="fas fa-check-circle text-blue-500 mr-2"></i> 20 Generations Daily</li>
                  <li><i className="fas fa-check-circle text-blue-500 mr-2"></i> 3 High-Fi Voices</li>
                </ul>
              </div>

              <div 
                onClick={() => setSelectedPlan({name: 'Enterprise', price: 199})}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-95 ${selectedPlan?.name === 'Enterprise' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-lg text-white">Enterprise</span>
                  <span className="text-indigo-400 font-black">₹199/mo</span>
                </div>
                <ul className="text-[9px] text-slate-400 space-y-2 font-bold uppercase tracking-wider">
                  <li><i className="fas fa-bolt text-indigo-500 mr-2"></i> 50 Generations Daily</li>
                  <li><i className="fas fa-bolt text-indigo-500 mr-2"></i> Voice Automation Unlocked</li>
                </ul>
              </div>
            </div>

            <button 
              disabled={!selectedPlan}
              onClick={() => setStep('pay')}
              className="w-full bg-blue-600 disabled:opacity-50 text-white h-16 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Secure Checkout
            </button>
          </div>
        ) : (
          <div className="space-y-8 pt-4">
            <div className="text-center">
              <h3 className="text-xl font-black text-white italic">Scan to Activate</h3>
              <p className="text-slate-500 text-[10px] mt-1 font-black uppercase tracking-widest">₹{selectedPlan?.price} • {selectedPlan?.name} Plan</p>
            </div>

            <div className="bg-white p-4 rounded-[2rem] flex flex-col items-center shadow-inner overflow-hidden max-w-[240px] mx-auto">
              <img 
                src={qrImageUrl} 
                alt="UPI QR Code" 
                className="w-full h-auto rounded-xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=aryan029298@okaxis%26am=${selectedPlan?.price}%26cu=INR`;
                }}
              />
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">UTR Reference Number</p>
              <input 
                type="text"
                maxLength={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-14 px-6 text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
                placeholder="Ex: 345678123456"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('pick')} className="flex-1 bg-slate-800 text-slate-400 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">Back</button>
              <button 
                onClick={handlePay}
                disabled={submitting || utr.length < 12}
                className="flex-[2] bg-blue-600 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20"
              >
                {submitting ? 'Processing...' : 'Verify Pay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BottomNav = ({ isAdmin }: { isAdmin: boolean }) => {
  const links = [
    { to: "/content", icon: "fa-pen-nib", label: "Branding" },
    { to: "/business", icon: "fa-briefcase", label: "Business" },
    { to: "/academy", icon: "fa-graduation-cap", label: "Academy" },
    { to: "/health", icon: "fa-heartbeat", label: "Health" },
  ];

  if (isAdmin) {
    links.push({ to: "/admin", icon: "fa-user-shield", label: "Admin" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/50 flex justify-around items-center h-20 sm:h-24 px-2 z-50">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 transition-all duration-300 relative ${
              isActive ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-500/5 scale-110' : ''}`}>
                <i className={`fas ${link.icon} text-xl sm:text-2xl`}></i>
              </div>
              <span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1.5 ${isActive ? 'opacity-100' : 'opacity-60'}`}>{link.label}</span>
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-400 rounded-b-full shadow-[0_0_15px_rgba(96,165,250,0.5)]"></div>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

const Header = ({ user, profile, onSubClick, onSearchClick }: { user: any, profile: any, onSubClick: () => void, onSearchClick: () => void }) => {
  const navigate = useNavigate();
  return (
    <header className="h-16 sm:h-20 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 border-b border-slate-800/50 sticky top-0 z-40">
      <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => navigate('/content')}>
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/30">BF</div>
        <h1 className="text-lg sm:text-xl font-black tracking-tighter text-white hidden xs:block">
          BrandFlow<span className="text-blue-500">AI</span>
        </h1>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-4 overflow-hidden">
        <button 
          onClick={onSearchClick}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900/50 text-slate-500 flex items-center justify-center border border-slate-800 transition-all hover:text-white hover:bg-slate-800 shrink-0"
        >
          <i className="fas fa-search text-xs sm:text-sm"></i>
        </button>
        <button onClick={onSubClick} className="bg-amber-500/5 text-amber-500 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase border border-amber-500/20 flex items-center gap-2 shrink-0 transition-all active:scale-95">
           <i className="fas fa-crown text-[8px] sm:text-xs"></i> 
           <span className="hidden xxs:inline">{profile?.status || 'Free'}</span>
        </button>
        <button 
          onClick={() => navigate('/profile')} 
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center border border-slate-800 transition-all hover:text-white hover:border-slate-700 shrink-0"
        >
          <i className="fas fa-user-circle text-sm sm:text-lg"></i>
        </button>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSub, setShowSub] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onValue(ref(db, `users/${u.uid}/profile`), (snap) => {
          setProfile(snap.val());
        });
      }
      setLoading(false);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8">
        <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-black animate-pulse shadow-2xl shadow-blue-500/30">BF</div>
        <div className="space-y-3 text-center">
           <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500 w-1/2 animate-shimmer"></div>
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Initializing Core Sync</p>
        </div>
      </div>
    </div>
  );

  const isAdmin = user?.email === 'aryan029298@gmail.com';

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 antialiased overflow-x-hidden selection:bg-blue-500/30">
        {!user ? (
          <Routes>
            <Route path="*" element={<Auth />} />
          </Routes>
        ) : (
          <>
            <Header user={user} profile={profile} onSubClick={() => setShowSub(true)} onSearchClick={() => setShowSearch(true)} />
            <main className="flex-1 pb-24 px-4 sm:px-8 pt-6 sm:pt-10 max-w-5xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<Navigate to="/content" replace />} />
                <Route path="/content" element={<ContentEngine profile={profile} />} />
                <Route path="/business" element={<BusinessSaaS profile={profile} />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/health" element={<HealthDashboard />} />
                <Route path="/profile" element={<Profile profile={profile} />} />
                {isAdmin && <Route path="/admin" element={<Admin />} />}
                <Route path="*" element={<Navigate to="/content" replace />} />
              </Routes>
            </main>
            <BottomNav isAdmin={isAdmin} />
            <SubscriptionModal isOpen={showSub} onClose={() => setShowSub(false)} user={user} />
            <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
          </>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
