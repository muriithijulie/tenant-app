-- Run this in Supabase SQL Editor AFTER supabase-schema.sql has already been run once.

-- Lets a tenant record be linked to the tenant's own login (separate from the landlord's account)
alter table tenants add column if not exists tenant_user_id uuid references auth.users(id) on delete set null;

-- Maintenance requests submitted by tenants, managed by landlords
create table if not exists maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  landlord_user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  description text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  created_at timestamp with time zone default now()
);

alter table maintenance_requests enable row level security;

create policy "Landlords manage their maintenance requests"
  on maintenance_requests for all
  using (auth.uid() = landlord_user_id)
  with check (auth.uid() = landlord_user_id);

create policy "Tenants view their own maintenance requests"
  on maintenance_requests for select
  using (
    exists (
      select 1 from tenants
      where tenants.id = maintenance_requests.tenant_id
      and tenants.tenant_user_id = auth.uid()
    )
  );

create policy "Tenants create their own maintenance requests"
  on maintenance_requests for insert
  with check (
    exists (
      select 1 from tenants
      where tenants.id = maintenance_requests.tenant_id
      and tenants.tenant_user_id = auth.uid()
    )
  );

-- Lets a tenant view their own lease/profile record
create policy "Tenants view their own tenant record"
  on tenants for select
  using (auth.uid() = tenant_user_id);

-- Lets a tenant claim their record on first portal signup, by matching email,
-- but only if no one has claimed it yet, and only ever to their own account.
create policy "Tenants can claim their own record by email"
  on tenants for update
  using (tenant_user_id is null and email = auth.jwt() ->> 'email')
  with check (tenant_user_id = auth.uid());

-- Lets a tenant view their own payment history
create policy "Tenants view their own payments"
  on payments for select
  using (
    exists (
      select 1 from tenants
      where tenants.id = payments.tenant_id
      and tenants.tenant_user_id = auth.uid()
    )
  );

-- Lets a tenant see the property their lease is attached to (name/address only, via the join)
create policy "Tenants view their own property"
  on properties for select
  using (
    exists (
      select 1 from tenants
      where tenants.property_id = properties.id
      and tenants.tenant_user_id = auth.uid()
    )
  );
