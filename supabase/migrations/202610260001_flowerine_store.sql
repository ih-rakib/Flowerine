-- Flowerine Supabase starter schema. Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 2 and 120),
 description text not null default '',
 price numeric(10,2) not null check (price >= 0),
 image_url text not null default '',
 categories text[] not null default '{}',
 stock integer not null default 0 check (stock >= 0),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 customer_name text not null,
 email text not null,
 phone text not null,
 delivery_address text not null,
 delivery_date date not null,
 occasion text not null,
 notes text not null default '',
 items jsonb not null,
 estimated_subtotal numeric(10,2) not null check (estimated_subtotal >= 0),
 status text not null default 'pending' check (status in ('pending','confirmed','preparing','out_for_delivery','completed','cancelled')),
 created_at timestamptz not null default now()
);
create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.admin_users enable row level security;
create or replace function public.is_flowerine_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select using (active = true or public.is_flowerine_admin());
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using (public.is_flowerine_admin()) with check (public.is_flowerine_admin());
drop policy if exists "Admins view orders" on public.orders;
create policy "Admins view orders" on public.orders for select to authenticated using (public.is_flowerine_admin());
drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders for update to authenticated using (public.is_flowerine_admin()) with check (public.is_flowerine_admin());
drop policy if exists "Admins view admin list" on public.admin_users;
create policy "Admins view admin list" on public.admin_users for select to authenticated using (user_id = auth.uid());
-- No public order INSERT policy: create orders through a server-side Edge Function.
