"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { acceptVanguardInvitation } from '../actions';

export default function VanguardInvitePage() {
  const params = useParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageName, setStageName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // In production, you would fetch user information derived from the token parameters
  const mockUserId = "current-logged-in-user-uuid"; 

  const handleAccept = async () => {
    if (!stageName.trim()) {
      alert("IDENTIFICATION_REQUIRED: ENTER STAGE NAME");
      return;
    }
    setIsProcessing(true);
    setMessage("[SYSTEM]: TRANSMITTING VANGUARD PERMISSIONS...");

    const response = await acceptVanguardInvitation(mockUserId, stageName);

    if (response.status === 'success') {
      setMessage("[SUCCESS]: LIFETIME VANGUARD CREDENTIALS GRANTED. REDIRECTING...");
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } else {
      setIsProcessing(false);
      setMessage(`[TERMINAL_ERROR]: ${response.message}`);
    }
  };

  const handleRefuse = () => {
    setMessage("[NOTICE]: INVITATION DECLINED. CONFIGURATION TERMINATED.");
    setTimeout(() => {
      window.location.href = 'https://google.com';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Visual background lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-xl p-8 bg-neutral-950 border border-neutral-900 rounded-2xl shadow-2xl relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1 border-b border-neutral-900 pb-4">
          <span className="text-[9px] tracking-[0.4em] text-[#D4AF37] font-black uppercase">
            SECURE MESH INGEST // ACCESS POINT
          </span>
          <h1 className="text-xl font-black tracking-widest uppercase text-white mt-1">
            EXCLUSIVE PROPOSAL
          </h1>
        </div>

        <div className="text-xs text-neutral-400 leading-relaxed space-y-3">
          <p>
            [SYSTEM_NOTICE]: You have been flagged by system operators as a high-tier musical asset. 
            Your technical production velocity qualifies your profile for an exclusive founding residency.
          </p>
          <p>
            Accepting this position grants your account zero-cost platform routing for life, a verified 
            Vanguard network indicator badge, and a reduced platform transactional overhead split (10%).
          </p>
        </div>

        {message && (
          <div className="p-3 bg-neutral-900/50 border border-[#D4AF37]/30 rounded text-[11px] text-[#D4AF37] tracking-wider animate-pulse">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
            CONFIRM ARTIST STAGE NAME:
          </label>
          <input 
            type="text"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            placeholder="e.g. FABIAN DUBZ"
            disabled={isProcessing}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs outline-none focus:border-[#D4AF37] text-white tracking-widest transition-colors uppercase"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-full py-4 bg-gradient-to-r from-[#AA8417] to-[#D4AF37] text-black font-black text-xs tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer uppercase shadow-lg"
          >
            [ ACCEPT POSITION ]
          </button>
          <button
            onClick={handleRefuse}
            disabled={isProcessing}
            className="w-full py-4 bg-transparent border border-neutral-800 text-neutral-500 font-bold text-xs tracking-widest rounded-xl transition-all hover:text-rose-500 hover:border-rose-500/30 active:scale-[0.98] disabled:opacity-40 cursor-pointer uppercase"
          >
            [ DECLINE PROPOSAL ]
          </button>
        </div>
      </div>
    </div>
  );
}