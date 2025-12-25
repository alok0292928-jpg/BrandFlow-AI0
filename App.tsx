
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ContentEngine from './pages/ContentEngine';
import BusinessSaaS from './pages/BusinessSaaS';
import Academy from './pages/Academy';
import HealthDashboard from './pages/HealthDashboard';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import { auth, db } from './services/firebaseService';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

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

  // Google Drive Direct Link for QR
  const qrImageUrl = "https://lh3.googleusercontent.com/d/1B30uFJK2jmQ7HVOEPKFzwL8l54GUzO2I";

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[60] flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[3rem] p-8 relative animate-in zoom-in-95 duration-300 my-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
        
        {step === 'pick' ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black text-white">Select Your Plan</h3>
              <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">Digital Business Partner</p>
            </div>
            
            <div className="space-y-4">
              <div 
                onClick={() => setSelectedPlan({name: 'Pro', price: 99})}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${selectedPlan?.name === 'Pro' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-white">Pro Plan</span>
                  <span className="text-blue-400 font-black">₹99/mo</span>
                </div>
                <ul className="text-[10px] text-slate-400 space-y-2 font-bold uppercase tracking-wider">
                  <li><i className="fas fa-check text-blue-500 mr-2"></i> 20 Post Generations Daily</li>
                  <li><i className="fas fa-check text-blue-500 mr-2"></i> 3 Voice Packs Daily</li>
                  <li><i className="fas fa-check text-blue-500 mr-2"></i> Viral Hook Generator</li>
                </ul>
              </div>

              <div 
                onClick={() => setSelectedPlan({name: 'Enterprise', price: 199})}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${selectedPlan?.name === 'Enterprise' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-white">Enterprise</span>
                  <span className="text-indigo-400 font-black">₹199/mo</span>
                </div>
                <ul className="text-[10px] text-slate-400 space-y-2 font-bold uppercase tracking-wider">
                  <li><i className="fas fa-check text-indigo-500 mr-2"></i> 50 Post Generations Daily</li>
                  <li><i className="fas fa-check text-indigo-500 mr-2"></i> 50 Voice Packs Daily</li>
                  <li><i className="fas fa-check text-indigo-500 mr-2"></i> Voice-to-Post Unlocked</li>
                </ul>
              </div>
            </div>

            <button 
              disabled={!selectedPlan}
              onClick={() => setStep('pay')}
              className="w-full bg-blue-600 disabled:opacity-50 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Proceed to Payment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-black text-white">Scan to Pay</h3>
              <p className="text-slate-500 text-xs mt-1 font-bold">Transferring ₹{selectedPlan?.price} for {selectedPlan?.name} Plan</p>
            </div>

            <div className="bg-white p-3 rounded-3xl flex flex-col items-center shadow-inner overflow-hidden">
              <img 
                src={qrImageUrl} 
                alt="UPI QR Code" 
                className="w-full h-auto rounded-2xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=aryan029298@okaxis%26am=${selectedPlan?.price}%26cu=INR`;
                }}
              />
              <p className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Scan & Pay with any UPI App</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Transaction UTR (12 Digits)</p>
              <input 
                type="text"
                maxLength={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
                placeholder="Ex: 345678123456"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('pick')} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-bold text-xs hover:text-white transition-colors">Back</button>
              <button 
                onClick={handlePay}
                disabled={submitting || utr.length < 12}
                className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Verify Transaction'}
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
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center h-20 px-2 z-50">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 transition-all duration-300 ${
              isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`
          }
        >
          <div className="p-2 rounded-2xl transition-all duration-300">
            <i className={`fas ${link.icon} text-lg mb-1`}></i>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-widest mt-1">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

const Header = ({ user, profile, onSubClick }: { user: any, profile: any, onSubClick: () => void }) => {
  return (
    <header className="h-16 bg-slate-950/50 backdrop-blur-lg flex items-center justify-between px-6 border-b border-slate-800 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/20">BF</div>
        <h1 className="text-xl font-black tracking-tighter text-white">
          BrandFlow<span className="text-blue-500">AI</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onSubClick} className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-amber-500/20 flex items-center gap-2">
           <i className="fas fa-crown text-[8px]"></i> {profile?.status || 'Free'}
        </button>
        <button onClick={() => signOut(auth)} className="w-9 h-9 rounded-xl bg-slate-900 text-slate-500 flex items-center justify-center border border-slate-800 transition-colors hover:text-rose-500">
          <i className="fas fa-sign-out-alt"></i>
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

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onValue(ref(db, `users/${u.uid}/profile`), (snap) => {
          setProfile(snap.val());
        });
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  const isAdmin = user?.email === 'aryan029298@gmail.com';

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200">
        {!user ? (
          <Routes>
            <Route path="*" element={<Auth />} />
          </Routes>
        ) : (
          <>
            <Header user={user} profile={profile} onSubClick={() => setShowSub(true)} />
            <main className="flex-1 pb-24 px-5 pt-6 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/content" replace />} />
                <Route path="/content" element={<ContentEngine profile={profile} />} />
                <Route path="/business" element={<BusinessSaaS profile={profile} />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/health" element={<HealthDashboard />} />
                {isAdmin && <Route path="/admin" element={<Admin />} />}
                <Route path="*" element={<Navigate to="/content" replace />} />
              </Routes>
            </main>
            <BottomNav isAdmin={isAdmin} />
            <SubscriptionModal isOpen={showSub} onClose={() => setShowSub(false)} user={user} />
          </>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
