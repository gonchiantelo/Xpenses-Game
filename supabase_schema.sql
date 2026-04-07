-- 📋 XPENSES GAME - ESQUEMA DE BASE DE DATOS
-- Copia este código y ejecútalo en el "SQL Editor" de Supabase.

-- 1. EXTENSIONES (Opcional, para IDs aleatorios)
create extension if not exists "uuid-ossp";

-- 2. TABLA DE PERFILES
-- Se vincula automáticamente con la tabla auth.users de Supabase
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  birthdate date,
  country text check (length(country) = 2), -- Código de país: UY, AR, etc.
  phone text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- 3. TABLA DE GRUPOS
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text default '💰',
  type text check (type in ('monthly', 'travel', 'event')),
  currency text not null default 'UYU',
  palette text default 'violet',
  created_at timestamp with time zone default now(),
  owner_id uuid references auth.users not null
);

-- 4. TABLA DE MIEMBROS DEL GRUPO
create table group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text check (role in ('admin', 'editor', 'member')) default 'member',
  budget numeric not null default 0,
  spent numeric not null default 0,
  joined_at timestamp with time zone default now()
);

-- 5. TABLA DE GASTOS
create table expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade,
  paid_by_id uuid references auth.users on delete cascade,
  amount numeric not null check (amount > 0),
  description text not null,
  category_id text, -- Referencia a CATEGORIES en lib/mockData.ts
  date date not null default current_date,
  is_fixed boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

-- 6. TABLA DE DEUDAS/SPLITS DE GASTOS
create table expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references expenses on delete cascade,
  user_id uuid references auth.users on delete cascade,
  amount numeric not null check (amount >= 0),
  is_paid boolean default false,
  created_at timestamp with time zone default now()
);

-- 7. TABLA DE NOTIFICACIONES
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  type text check (type in ('debt', 'budget_warning', 'budget_exceeded', 'fixed_expense', 'payment_received', 'group_invite')),
  title text not null,
  body text not null,
  group_id uuid references groups on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 8. POLÍTICAS DE SEGURIDAD (RLS)
-- Por ahora habilitamos RLS para que Supabase sea seguro.
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- Política simple: El usuario puede ver su propio perfil
create policy "Users can see own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Política: El usuario puede ver grupos de los que es miembro
create policy "Members can see groups" on groups for select using (
  exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid())
);
