-- Guia Regional de Políticas Públicas (Zona Leste SP) — Supabase Schema
-- Autenticação, Autorização por Perfis (RBAC via RLS), Locais Favoritos Sincronizados
-- e Sugestões/Atualizações Comunitárias com Moderação.
-- Execute no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).

-- 1. Perfis de usuário e controle de autorização (role: 'user' | 'educator' | 'admin')
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user',
  name text,
  distrito_preferido text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists distrito_preferido text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Função auxiliar de autorização (RBAC): verifica se o usuário autenticado possui
-- papel 'admin' ou 'educator' (ex.: equipe CEFAI, NAAPA, DREG, pesquisadores).
create or replace function public.is_admin_or_educator()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'educator')
  );
$$;

-- Trigger para criar automaticamente a linha em public.profiles ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Equipamentos Públicos Favoritos e Anotações Pessoais da Família / Educador
create table if not exists public.favorite_equipamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  equipamento_id integer not null,
  nota_pessoal text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, equipamento_id)
);

alter table public.favorite_equipamentos enable row level security;

drop policy if exists "Users can view their own favorite equipamentos" on public.favorite_equipamentos;
create policy "Users can view their own favorite equipamentos"
  on public.favorite_equipamentos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own favorite equipamentos" on public.favorite_equipamentos;
create policy "Users can add their own favorite equipamentos"
  on public.favorite_equipamentos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own favorite equipamentos" on public.favorite_equipamentos;
create policy "Users can update their own favorite equipamentos"
  on public.favorite_equipamentos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorite equipamentos" on public.favorite_equipamentos;
create policy "Users can delete their own favorite equipamentos"
  on public.favorite_equipamentos for delete
  using (auth.uid() = user_id);

-- 3. Sugestões de Atualização de Equipamentos Públicos (com Autorização de Moderação)
create table if not exists public.equipamento_sugestoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  equipamento_id integer,
  nome_equipamento text not null,
  distrito text not null,
  tipo_contribuicao text not null default 'atualizacao', -- 'atualizacao' | 'novo_local' | 'horario_telefone'
  descricao text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

alter table public.equipamento_sugestoes enable row level security;

drop policy if exists "Users can view approved suggestions or their own or if moderator" on public.equipamento_sugestoes;
create policy "Users can view approved suggestions or their own or if moderator"
  on public.equipamento_sugestoes for select
  using (
    status = 'approved'
    or auth.uid() = user_id
    or public.is_admin_or_educator()
  );

drop policy if exists "Authenticated users can submit suggestions" on public.equipamento_sugestoes;
create policy "Authenticated users can submit suggestions"
  on public.equipamento_sugestoes for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Only admins or educators can moderate suggestions" on public.equipamento_sugestoes;
create policy "Only admins or educators can moderate suggestions"
  on public.equipamento_sugestoes for update
  using (public.is_admin_or_educator())
  with check (public.is_admin_or_educator());

drop policy if exists "Authors or admins can delete suggestions" on public.equipamento_sugestoes;
create policy "Authors or admins can delete suggestions"
  on public.equipamento_sugestoes for delete
  using (auth.uid() = user_id or public.is_admin_or_educator());
