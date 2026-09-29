'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Nav from '../../components/Nav';

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ tenant_id: '', amount: '', due_date: '', status: 'pending' });
  const [error, setError] = useState('');

  async function loadData() {
    const [{ data: paymentData }, { data: tenantData }] = await Promise.all([
      supabase.from('payments').select('*, tenants(name)').order('due_date', { ascending: false }),
      supabase.from('tenants').select('id, name'),
    ]);
    setPayments(paymentData || []);
    setTenants(tenantData || []);
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      await loadData();
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('payments').insert({
      tenant_id: form.tenant_id,
      amount: Number(form.amount),
      due_date: form.due_date,
      status: form.status,
      user_id: user.id,
    });
    if (error) {
      setError(error.message);
    } else {
      setForm({ tenant_id: '', amount: '', due_date: '', status: 'pending' });
      await loadData();
    }
  }

  async function handleStatusChange(id, status) {
    await supabase.from('payments').update({ status }).eq('id', id);
    await loadData();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this payment record?')) return;
    await supabase.from('payments').delete().eq('id', id);
    await loadData();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  const statusColors = {
    paid: 'text-green-700 bg-green-50 border-green-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    overdue: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Rent Payments</h1>

        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border border-slate-200 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select required value={form.tenant_id}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2">
            <option value="">Select tenant</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input required type="number" placeholder="Amount ($)" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2" />
          <input required type="date" value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2" />
          <select value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2">
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button type="submit" className="bg-slate-800 text-white rounded-lg px-5 py-2 font-medium hover:bg-slate-900 sm:col-span-2">
            Add Payment
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="space-y-3">
          {payments.length === 0 && <p className="text-slate-500">No payments recorded yet.</p>}
          {payments.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{p.tenants?.name || 'Unknown tenant'}</p>
                <p className="text-sm text-slate-500">${p.amount} · due {p.due_date}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={p.status}
                  onChange={(e) => handleStatusChange(p.id, e.target.value)}
                  className={`text-sm border rounded-lg px-2 py-1 ${statusColors[p.status] || ''}`}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
