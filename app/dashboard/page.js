'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Nav from '../../components/Nav';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ properties: 0, tenants: 0, overdue: 0 });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const [{ count: propertyCount }, { count: tenantCount }, { count: overdueCount }] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
      ]);

      setCounts({
        properties: propertyCount || 0,
        tenants: tenantCount || 0,
        overdue: overdueCount || 0,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Properties</p>
            <p className="text-3xl font-bold text-slate-800">{counts.properties}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Tenants</p>
            <p className="text-3xl font-bold text-slate-800">{counts.tenants}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Overdue Payments</p>
            <p className="text-3xl font-bold text-red-600">{counts.overdue}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
