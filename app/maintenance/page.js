'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Nav from '../../components/Nav';

export default function LandlordMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  async function loadRequests() {
    const { data } = await supabase
      .from('maintenance_requests')
      .select('*, tenants(name), properties(name)')
      .order('created_at', { ascending: false });
    setRequests(data || []);
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      await loadRequests();
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleStatusChange(id, status) {
    await supabase.from('maintenance_requests').update({ status }).eq('id', id);
    await loadRequests();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  const statusColors = {
    open: 'text-amber-700 bg-amber-50 border-amber-200',
    in_progress: 'text-blue-700 bg-blue-50 border-blue-200',
    resolved: 'text-green-700 bg-green-50 border-green-200',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Maintenance Requests</h1>
        <div className="space-y-3">
          {requests.length === 0 && <p className="text-slate-500">No maintenance requests yet.</p>}
          {requests.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  {r.tenants?.name || 'Unknown tenant'}
                  {r.properties?.name && <span className="text-slate-400 font-normal"> · {r.properties.name}</span>}
                </p>
                <p className="text-sm text-slate-600">{r.description}</p>
                <p className="text-xs text-slate-400 mt-1">{r.priority} priority</p>
              </div>
              <select
                value={r.status}
                onChange={(e) => handleStatusChange(r.id, e.target.value)}
                className={`text-sm border rounded-lg px-2 py-1 ${statusColors[r.status] || ''}`}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
