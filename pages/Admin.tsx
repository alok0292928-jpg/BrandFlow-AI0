
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebaseService';
import { ref, onValue, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const Admin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const pendingRef = ref(db, 'pendingPayments');
    
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.keys(data).map(key => ({
          id: key,
          ...data[key].profile
        }));
        setUsers(userList);
      }
    });

    onValue(pendingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPending(Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })));
      } else {
        setPending([]);
      }
      setLoading(false);
    });
  }, []);

  const handleApprove = async (pay: any) => {
    try {
      // Update user profile status
      await update(ref(db, `users/${pay.uid}/profile`), {
        status: pay.plan,
        expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      });
      // Remove from pending
      await remove(ref(db, `pendingPayments/${pay.uid}`));
      alert(`Approved ${pay.plan} for ${pay.email}`);
    } catch (e) {
      alert("Error approving payment");
    }
  };

  const handleReject = async (pay: any) => {
    if (!confirm("Are you sure you want to reject this payment?")) return;
    await remove(ref(db, `pendingPayments/${pay.uid}`));
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-white italic">Admin Panel</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Growth Control Center</p>
        </div>
        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
          <i className="fas fa-user-shield text-xl"></i>
        </div>
      </div>

      {/* Pending Payments Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-4 flex items-center gap-2">
          <i className="fas fa-clock"></i> Pending Payment Approvals ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 text-center text-slate-600 text-xs font-bold">
            All caught up! No pending payments.
          </div>
        ) : pending.map(p => (
          <div key={p.id} className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-xs font-black text-white truncate">{p.email}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">UTR: <span className="text-blue-400">{p.utr}</span></p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plan: <span className="text-amber-500">{p.plan} (₹{p.price})</span></p>
              </div>
              <div className="text-[9px] text-slate-600 font-bold whitespace-nowrap">
                {new Date(p.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-800/50">
              <button onClick={() => handleApprove(p)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/10">Approve</button>
              <button onClick={() => handleReject(p)} className="flex-1 bg-rose-600/10 text-rose-500 py-3 rounded-xl font-black text-[10px] uppercase border border-rose-500/20">Reject</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
          <h3 className="text-white font-bold text-sm">Active Partner Network</h3>
        </div>
        <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center"><i className="fas fa-spinner animate-spin text-slate-700"></i></div>
          ) : users.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                  {u.email?.substring(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate w-32">{u.email}</p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase">{u.status || 'Free'}</p>
                </div>
              </div>
              {u.isAdmin ? (
                <span className="text-[7px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md border border-blue-500/20 uppercase">Admin</span>
              ) : (
                <div className="text-[7px] text-slate-600 font-bold uppercase">{new Date(u.createdAt).toLocaleDateString()}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
