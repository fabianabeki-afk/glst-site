'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { BroadcasterStudio } from '@/components/BroadcasterStudio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DJModePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dj`,
          },
        });
        if (error) throw error;
        alert('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-sm tracking-widest">LOADING...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth gate
  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
        <header className="border-b border-neutral-900 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🔴</span>
              <span className="font-black tracking-wider">GUESTLIST.TV</span>
            </Link>
            <Link
              href="/"
              className="text-xs font-bold tracking-widest text-neutral-400 hover:text-white transition-colors"
            >
              ← BACK TO FAN MODE
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl">🎧</div>
              <h1 className="text-2xl font-black tracking-wider">DJ MODE</h1>
              <p className="text-sm text-neutral-400">Sign in to broadcast your set</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest text-neutral-500">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="dj@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest text-neutral-500">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError && (
                <div className="text-red-500 text-sm bg-red-950/50 border border-red-800 rounded-lg p-3">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm tracking-widest py-3 rounded-lg transition-colors"
              >
                {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'New DJ? Create account'}
              </button>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <p className="text-xs text-neutral-500 text-center">
                DJ accounts get access to broadcasting, analytics, and supporter features.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated - show DJ studio
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-900 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔴</span>
            <span className="font-black tracking-wider">GUESTLIST.TV — DJ STUDIO</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs font-bold tracking-widest text-neutral-400 hover:text-white transition-colors"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <BroadcasterStudio />
      </main>
    </div>
  );
}
