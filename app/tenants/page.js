'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Nav from '../../components/Nav';

export default function TenantsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', property_id: '', rent_amount: '', lease_start: '', lease_end: '',
  });
  const [error, setError] = useState('');

  async function loadData() {
    const [{ data: tenantData }, { data: propertyData }] = await Promise.all([
      supabase.from('tenants').select('*, properties(name)').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name'),
    ]);
    setTenants(tenantData || []);
    setProperties(propertyData || []);
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
    const { error } = await supabase.from('tenants').insert({
      ...form,
      rent_amount: form.rent_amount ? Number(form.rent_amount) : null,
      lease_start: form.lease_start || null,
      lease_end: form.lease_end || null,
      property_id: form.property_id || null,
      user_id: user.id,
    });
    if (error) {
      setError(error.message);
    } else {
      setForm({ name: '', email: '', phone: '', property_id: '', rent_amount: '', lease_start: '', lease_end: '' });
      await loadData();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tenant?')) return;
    await supabase.from('tenants').delete().eq('id', id);
    await loadData();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Tenants</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tenants can access their portal at <span className="font-mono">/portal/login</span> using the
          exact email you enter for them below.
        </p>

        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border border-slate-200 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2" />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2" />
          <input placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2" />
          <select value={form.property_id}
            onChange={(e) => setForm({ ...form, property_id: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2">
            <option value="">Select property (optional)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input type="number" placeholder="Monthly rent ($)" value={form.rent_amount}
            onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2" />
          <div className="flex gap-3">
            <input type="date" value={form.lease_start}
              onChange={(e) => setForm({ ...form, lease_start: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 flex-1" />
            <input type="date" value={form.lease_end}
              onChange={(e) => setForm({ ...form, lease_end: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 flex-1" />
          </div>
          <button type="submit" className="bg-slate-800 text-white rounded-lg px-5 py-2 font-medium hover:bg-slate-900 sm:col-span-2">
            Add Tenant
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="space-y-3">
          {tenants.length === 0 && <p className="text-slate-500">No tenants yet.</p>}
          {tenants.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="text-sm text-slate-500">
                  {t.properties?.name ? `${t.properties.name} · ` : ''}
                  {t.email} {t.phone && `· ${t.phone}`}
                </p>
                {t.rent_amount && <p className="text-sm text-slate-500">${t.rent_amount}/mo</p>}
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
