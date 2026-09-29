'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Nav() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg text-slate-800">TenantHub</span>
        <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
        <Link href="/properties" className="text-slate-600 hover:text-slate-900">Properties</Link>
        <Link href="/tenants" className="text-slate-600 hover:text-slate-900">Tenants</Link>
        <Link href="/payments" className="text-slate-600 hover:text-slate-900">Payments</Link>
        <Link href="/maintenance" className="text-slate-600 hover:text-slate-900">Maintenance</Link>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-slate-500 hover:text-red-600"
      >
        Log out
      </button>
    </nav>
  );
}
