'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import PortalNav from '../../components/PortalNav';

export default function PortalHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/portal/login');
        return;
      }

      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('*, properties(name, address)')
        .eq('tenant_user_id', session.user.id)
        .maybeSingle();

      if (!tenantRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTenant(tenantRow);

      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantRow.id)
        .order('due_date', { ascending: false });

      setPayments(paymentData || []);
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PortalNav />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-slate-700">
              We couldn't find a lease linked to your account yet. Make sure you signed up with the
              exact email your landlord has on file, then log out and back in.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const statusColors = {
    paid: 'text-green-700 bg-green-50 border-green-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    overdue: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">My Lease</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Property</p>
              <p className="font-medium text-slate-800">{tenant.properties?.name || '—'}</p>
              <p className="text-slate-500">{tenant.properties?.address}</p>
            </div>
            <div>
              <p className="text-slate-500">Monthly rent</p>
              <p className="font-medium text-slate-800">{tenant.rent_amount ? `$${tenant.rent_amount}` : '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Lease start</p>
              <p className="font-medium text-slate-800">{tenant.lease_start || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Lease end</p>
              <p className="font-medium text-slate-800">{tenant.lease_end || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Payment History</h2>
          {payments.length === 0 && <p className="text-slate-500 text-sm">No payments recorded yet.</p>}
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-700">Due {p.due_date} · ${p.amount}</span>
                <span className={`text-xs border rounded-lg px-2 py-1 ${statusColors[p.status] || ''}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
