'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import PortalNav from '../../../components/PortalNav';

export default function PortalMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [requests, setRequests] = useState([]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [error, setError] = useState('');

  async function loadRequests(tenantId) {
    const { data } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/portal/login');
        return;
      }
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('id, user_id, property_id')
        .eq('tenant_user_id', session.user.id)
        .maybeSingle();

      if (!tenantRow) {
        setLoading(false);
        return;
      }
      setTenant(tenantRow);
      await loadRequests(tenantRow.id);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.from('maintenance_requests').insert({
      tenant_id: tenant.id,
      property_id: tenant.property_id,
      landlord_user_id: tenant.user_id,
      description,
      priority,
      status: 'open',
    });
    if (error) {
      setError(error.message);
    } else {
      setDescription('');
      setPriority('normal');
      await loadRequests(tenant.id);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PortalNav />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <p className="text-slate-700">No lease linked to your account yet.</p>
        </main>
      </div>
    );
  }

  const statusColors = {
    open: 'text-amber-700 bg-amber-50 border-amber-200',
    in_progress: 'text-blue-700 bg-blue-50 border-blue-200',
    resolved: 'text-green-700 bg-green-50 border-green-200',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Maintenance Requests</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 mb-8 space-y-3">
          <textarea
            required
            placeholder="Describe the issue (e.g. kitchen faucet leaking)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            rows={3}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="low">Low priority</option>
            <option value="normal">Normal priority</option>
            <option value="urgent">Urgent</option>
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="bg-slate-800 text-white rounded-lg px-5 py-2 font-medium hover:bg-slate-900">
            Submit Request
          </button>
        </form>

        <div className="space-y-3">
          {requests.length === 0 && <p className="text-slate-500">No requests submitted yet.</p>}
          {requests.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs border rounded-lg px-2 py-1 ${statusColors[r.status] || ''}`}>
                  {r.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">{r.priority}</span>
              </div>
              <p className="text-sm text-slate-700">{r.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
