-- =============================================
-- XPENSES GAME — ESQUEMA MAESTRO v2.0
-- Supabase SQL Editor → Ejecutar completo
-- Cambios v2: expense_splits + theme_preference en profiles
-- =============================================

-- 0. LIMPIEZA TOTAL
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_member_of(uuid) cascade;
drop table if exists notifications cascade;
drop table if exists expense_splits cascade;
drop table if exists expenses cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists profiles cascade;

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA DE PERFILES (v2: +theme_preference)
create table profiles (
  id              uuid references auth.users on delete cascade primary key,
  first_name      text,
  last_name       text,
  country         text check (length(country) = 2),
  phone           text,
  avatar_url      text,
  -- Preferencia de tema: null = aún no eligió (dispara onboarding)
  theme_preference text check (theme_preference in ('dark', 'light')) default null,
  updated_at      timestamp with time zone default now()
);

-- 3. TABLA DE GRUPOS
create table groups (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  emoji       text default '💰',
  type        text check (type in ('monthly', 'travel', 'event')),
  currency    text not null default 'UYU',
  palette     text default 'green',
  invite_code text unique default upper(substring(gen_random_uuid()::text from 1 for 6)),
  created_at  timestamp with time zone default now(),
  owner_id    uuid references auth.users not null default auth.uid()
);

-- 4. TABLA DE MIEMBROS
create table group_members (
  id        uuid default gen_random_uuid() primary key,
  group_id  uuid references groups on delete cascade,
  user_id   uuid references auth.users on delete cascade,
  role      text check (role in ('admin', 'editor', 'member')) default 'member',
  budget    numeric not null default 0,
  spent     numeric not null default 0,
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- 5. TABLA DE GASTOS
create table expenses (
  id          uuid default gen_random_uuid() primary key,
  group_id    uuid references groups on delete cascade,
  paid_by_id  uuid references auth.users on delete cascade,
  amount      numeric not null check (amount > 0),
  description text not null,
  category_id text,
  date        date not null default current_date,
  is_fixed    boolean default false,
  notes       text,
  created_at  timestamp with time zone default now()
);

-- 6. TABLA DE SPLITS (v2 — NUEVA)
-- "Libro diario": registra exactamente cuánto le debe cada miembro al pagador
-- Split: quien debe (debtor_id) → cuánto (amount) → al pagador del gasto
create table expense_splits (
  id          uuid default gen_random_uuid() primary key,
  expense_id  uuid references expenses on delete cascade not null,
  debtor_id   uuid references auth.users on delete cascade not null,
  amount      numeric not null check (amount >= 0),
  is_settled  boolean default false,
  settled_at  timestamp with time zone,
  created_at  timestamp with time zone default now(),
  unique(expense_id, debtor_id)
);

-- 7. TABLA DE NOTIFICACIONES
create table notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade,
  group_id   uuid references groups on delete cascade,
  type       text check (type in ('expense', 'overbudget', 'invite', 'settlement', 'system')),
  title      text not null,
  message    text not null,
  is_read    boolean default false,
  created_at timestamp with time zone default now()
);

-- 8. FUNCIONES DE SEGURIDAD
-- Función para chequear membresía sin recursividad
create or replace function public.is_member_of(gid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, theme_preference)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    null  -- null = dispara onboarding de tema
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. SEGURIDAD (RLS)
alter table profiles       enable row level security;
alter table groups         enable row level security;
alter table group_members  enable row level security;
alter table expenses       enable row level security;
alter table expense_splits enable row level security;
alter table notifications  enable row level security;

-- POLÍTICAS: PROFILES
create policy "Ver perfiles de mis grupos" on profiles for select
using (
  exists (
    select 1 from group_members gm
    where gm.user_id = profiles.id and is_member_of(gm.group_id)
  ) or auth.uid() = id
);
create policy "Modificar mi perfil" on profiles for update
using ( auth.uid() = id );

-- POLÍTICAS: GROUPS
create policy "Crear grupos" on groups for insert
with check ( auth.role() = 'authenticated' );
create policy "Ver grupos si soy dueño o miembro" on groups for select
using ( owner_id = auth.uid() or is_member_of(id) );
create policy "Dueño puede editar grupo" on groups for update
using ( owner_id = auth.uid() );

-- POLÍTICAS: GROUP_MEMBERS
create policy "Ver miembros de mis grupos" on group_members for select
using ( is_member_of(group_id) );
create policy "Dueño o invitado puede insertarse" on group_members for insert
with check (
  auth.uid() = user_id or
  exists ( select 1 from groups where id = group_id and owner_id = auth.uid() )
);

-- POLÍTICAS: EXPENSES
create policy "Ver gastos de mis grupos" on expenses for select
using ( is_member_of(group_id) );
create policy "Miembros pueden añadir gastos" on expenses for insert
with check ( is_member_of(group_id) );

-- POLÍTICAS: EXPENSE_SPLITS
create policy "Ver splits de mis gastos" on expense_splits for select
using (
  exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id and is_member_of(e.group_id)
  )
);
create policy "Miembros pueden crear splits" on expense_splits for insert
with check (
  exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id and is_member_of(e.group_id)
  )
);
create policy "Deudor puede marcar su split como saldado" on expense_splits for update
using ( auth.uid() = debtor_id );

-- POLÍTICAS: NOTIFICATIONS
create policy "Ver mi bandeja de entrada" on notifications for select
using ( auth.uid() = user_id );
create policy "Insertar notificaciones" on notifications for insert
with check ( is_member_of(group_id) );

-- 10. INICIALIZACIÓN
-- Sincronizar perfiles de usuarios que ya existen
insert into public.profiles (id, first_name, last_name, theme_preference)
select
  id,
  raw_user_meta_data->>'first_name',
  raw_user_meta_data->>'last_name',
  null
from auth.users
on conflict (id) do nothing;
