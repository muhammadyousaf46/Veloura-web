-- ==========================================================================
-- VELOURA — Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ==========================================================================

-- ---- Extensions ----
create extension if not exists "uuid-ossp";

-- ==========================================================================
-- TABLES
-- ==========================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  address text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text,
  order_type text not null check (order_type in ('delivery', 'pickup')),
  payment_method text not null check (payment_method in ('cod', 'jazzcash', 'easypaisa')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'cod')),
  order_status text not null default 'pending' check (
    order_status in ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')
  ),
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  reservation_date date not null,
  reservation_time time not null,
  guests integer not null check (guests > 0),
  special_request text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reservations enable row level security;
alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ---- profiles ----
create policy "Users view own profile" on profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- ---- categories (public read, admin write) ----
create policy "Anyone can view categories" on categories
  for select using (true);
create policy "Admins manage categories" on categories
  for all using (public.is_admin());

-- ---- menu_items (public read, admin write) ----
create policy "Anyone can view menu items" on menu_items
  for select using (true);
create policy "Admins manage menu items" on menu_items
  for all using (public.is_admin());

-- ---- orders ----
create policy "Users view own orders" on orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create own orders" on orders
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "Admins update orders" on orders
  for update using (public.is_admin());

-- ---- order_items ----
create policy "Users view own order items" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "Users insert own order items" on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null))
  );

-- ---- reservations ----
create policy "Users view own reservations" on reservations
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create reservations" on reservations
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "Users update own pending reservations" on reservations
  for update using (auth.uid() = user_id or public.is_admin());

-- ---- contact_messages (write-only for public, admin reads) ----
create policy "Anyone can submit a message" on contact_messages
  for insert with check (true);
create policy "Admins view messages" on contact_messages
  for select using (public.is_admin());
create policy "Admins update messages" on contact_messages
  for update using (public.is_admin());

-- ---- newsletter_subscribers (write-only for public, admin reads) ----
create policy "Anyone can subscribe" on newsletter_subscribers
  for insert with check (true);
create policy "Admins view subscribers" on newsletter_subscribers
  for select using (public.is_admin());

-- ==========================================================================
-- SEED DATA (sample categories + menu items — replace/expand as needed)
-- ==========================================================================
insert into categories (name, description) values
  ('Starters', 'Small plates to begin your meal'),
  ('Main Course', 'Our signature entrees'),
  ('Burgers', 'Char-grilled and stacked'),
  ('Pizza', 'Wood-fired classics'),
  ('BBQ & Grill', 'Smoked and flame-grilled'),
  ('Desi Cuisine', 'Traditional South Asian dishes'),
  ('Chinese', 'Wok-fired favorites'),
  ('Pasta', 'House-made and imported'),
  ('Seafood', 'Fresh catch, simply prepared'),
  ('Desserts', 'Sweet endings'),
  ('Beverages', 'Crafted drinks, hot and cold')
on conflict do nothing;