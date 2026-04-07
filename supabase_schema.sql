-- 📋 XPENSES GAME - ESQUEMA DE BASE DE DATOS PROFESIONAL
-- Copia todo este código y pégalo en el "SQL Editor" de Supabase.

-- 0. LIMPIEZA (Para poder re-ejecutar el script sin errores)
drop table if exists notifications cascade;
drop table if exists expense_splits cascade;
drop table if exists expenses cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists profiles cascade;

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA DE PERFILES (Vinculada a auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  country text check (length(country) = 2),
  phone text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- 3. TABLA DE GRUPOS (Con código de invitación)
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text default '💰',
  type text check (type in ('monthly', 'travel', 'event')),
  currency text not null default 'UYU',
  palette text default 'violet',
  invite_code text unique default upper(substring(gen_random_uuid()::text from 1 for 6)),
  created_at timestamp with time zone default now(),
  owner_id uuid references auth.users not null
);

-- 4. TABLA DE MIEMBROS
create table group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text check (role in ('admin', 'editor', 'member')) default 'member',
  budget numeric not null default 0,
  spent numeric not null default 0,
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id) -- Un usuario no puede estar dos veces en el mismo grupo
);

-- 5. TABLA DE GASTOS
create table expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade,
  paid_by_id uuid references auth.users on delete cascade,
  amount numeric not null check (amount > 0),
  description text not null,
  category_id text,
  date date not null default current_date,
  is_fixed boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

-- 6. DISPARADOR DE PERFILES (Crea el perfil automáticamente al registrarse)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. SEGURIDAD (RLS)
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;

-- Políticas de Perfiles
create policy "Ver perfiles de miembros de mis grupos" on profiles for select
using ( exists ( select 1 from group_members gm where gm.user_id = profiles.id and gm.group_id in ( select group_id from group_members where user_id = auth.uid() ) ) or auth.uid() = id );

create policy "Modificar mi propio perfil" on profiles for update using ( auth.uid() = id );

-- Políticas de Grupos
create policy "Ver grupos de los que soy miembro" on groups for select
using ( exists ( select 1 from group_members where group_id = groups.id and user_id = auth.uid() ) );

create policy "Dueño puede editar grupo" on groups for update 
using ( owner_id = auth.uid() );

-- Políticas de Gastos
create policy "Ver gastos de mis grupos" on expenses for select
using ( exists ( select 1 from group_members where group_id = expenses.group_id and user_id = auth.uid() ) );

create policy "Cualquier miembro de grupo puede añadir gastos" on expenses for insert
with check ( exists ( select 1 from group_members where group_id = expenses.group_id and user_id = auth.uid() ) );
