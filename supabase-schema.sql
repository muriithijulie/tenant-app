-- Run this whole file once in Supabase: SQL Editor -> New Query -> paste all -> Run

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamp with time zone default now()
);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  name text not null,
  email text,
  phone text,
  rent_amount numeric,
  lease_start date,
  lease_end date,
  created_at timestamp with time zone default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  amount numeric not null,
  due_date date not null,
  status text not null default 'pending',
  created_at timestamp with time zone default now()
);

-- Row Level Security: every landlord can only ever see/edit their own rows.
alter table properties enable row level security;
alter table tenants enable row level security;
alter table payments enable row level security;

create policy "Users manage their own properties"
  on properties for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own tenants"
  on tenants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own payments"
  on payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
