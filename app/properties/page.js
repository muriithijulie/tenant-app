'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Nav from '../../components/Nav';

export default function PropertiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  async function loadProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProperties(data || []);
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      await loadProperties();
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('properties').insert({
      name,
      address,
      user_id: user.id,
    });
    if (error) {
      setError(error.message);
    } else {
      setName('');
      setAddress('');
      await loadProperties();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    await supabase.from('properties').delete().eq('id', id);
    await loadProperties();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Properties</h1>

        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border border-slate-200 mb-8 flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm text-slate-600 mb-1">Property name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sunset Apartments"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-slate-600 mb-1">Address</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <button type="submit" className="bg-slate-800 text-white rounded-lg px-5 py-2 font-medium hover:bg-slate-900">
            Add Property
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="space-y-3">
          {properties.length === 0 && (
            <p className="text-slate-500">No properties yet. Add your first one above.</p>
          )}
          {properties.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{p.name}</p>
                <p className="text-sm text-slate-500">{p.address}</p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
