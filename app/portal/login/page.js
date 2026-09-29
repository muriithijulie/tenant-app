'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function PortalLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function claimTenantRecord() {
    // Links this login to the tenant row the landlord already created with this email.
    // Safe because the database only allows this when the record is unclaimed
    // and the email matches the logged-in user's own email.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('tenants')
      .update({ tenant_user_id: user.id })
      .eq('email', user.email)
      .is('tenant_user_id', null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setInfo('Account created! If email confirmation is on, check your inbox, then sign in below.');
        setMode('signin');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
      await claimTenantRecord();
      setLoading(false);
      router.push('/portal');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Tenant Portal</h1>
        <p className="text-slate-500 mb-6">
          {mode === 'signin' ? 'Sign in with the email your landlord has on file' : 'Create your portal account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white rounded-lg py-2 font-medium hover:bg-slate-900 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
          className="mt-4 text-sm text-slate-500 hover:text-slate-800 underline w-full text-center"
        >
          {mode === 'signin' ? "First time here? Create an account" : 'Already have an account? Sign in'}
        </button>

        <p className="mt-6 text-xs text-slate-400 text-center">
          Use the exact email your landlord added you with, or your lease won't show up.
        </p>
      </div>
    </div>
  );
}
