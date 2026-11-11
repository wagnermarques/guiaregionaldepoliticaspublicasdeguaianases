-- Guia Regional de Políticas Públicas (Zona Leste SP)
-- Migração 0002: Papéis específicos por aplicativo e Tabela de Equipamentos editável por 'guia_admin'

-- 1. Adicionar coluna 'role_guia' na tabela public.profiles para isolar permissões por app
-- Papéis possíveis para o Guia Regional: 'user' | 'educator' | 'guia_admin' | 'super_admin'
alter table public.profiles add column if not exists role_guia text not null default 'user';

-- Migrar usuários existentes que tinham role='admin' para role_guia='guia_admin'
update public.profiles
set role_guia = 'guia_admin'
where role = 'admin' and (role_guia is null or role_guia = 'user');

-- Migrar usuários existentes que tinham role='educator' para role_guia='educator'
update public.profiles
set role_guia = 'educator'
where role = 'educator' and (role_guia is null or role_guia = 'user');

-- 2. Função de autorização para Guia Admin (somente admins do Guia Regional ou super admins)
create or replace function public.is_guia_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role_guia in ('guia_admin', 'super_admin')
  );
$$;

-- Atualizar is_admin_or_educator() para checar role_guia
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
      and (role_guia in ('guia_admin', 'educator', 'super_admin') or role in ('admin', 'educator'))
  );
$$;

-- 3. Tabela public.equipamentos (dados editáveis em nuvem)
create table if not exists public.equipamentos (
  id integer primary key,
  nome text not null,
  categoria text not null,
  subtipo text not null,
  distrito text not null,
  regiao text not null default 'Zona Leste',
  endereco_completo text not null,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text not null default 'São Paulo',
  uf text not null default 'SP',
  cep text,
  telefones jsonb not null default '[]'::jsonb,
  celulares_plantao jsonb not null default '[]'::jsonb,
  email text,
  horario_funcionamento text,
  responsaveis text,
  servicos_oferecidos text,
  observacoes text,
  pagina_pdf integer,
  lat double precision,
  lng double precision,
  urgencia_24h boolean not null default false,
  como_acessar text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.equipamentos enable row level security;

-- Leitura: PÚBLICA (qualquer pessoa visualiza os dados atualizados pelo app)
drop policy if exists "Equipamentos are viewable by everyone" on public.equipamentos;
create policy "Equipamentos are viewable by everyone"
  on public.equipamentos for select
  using (true);

-- Inserção: SOMENTE guia_admin ou super_admin
drop policy if exists "Only guia admins can insert equipamentos" on public.equipamentos;
create policy "Only guia admins can insert equipamentos"
  on public.equipamentos for insert
  with check (public.is_guia_admin());

-- Atualização: SOMENTE guia_admin ou super_admin
drop policy if exists "Only guia admins can update equipamentos" on public.equipamentos;
create policy "Only guia admins can update equipamentos"
  on public.equipamentos for update
  using (public.is_guia_admin())
  with check (public.is_guia_admin());

-- Exclusão: SOMENTE guia_admin ou super_admin
drop policy if exists "Only guia admins can delete equipamentos" on public.equipamentos;
create policy "Only guia admins can delete equipamentos"
  on public.equipamentos for delete
  using (public.is_guia_admin());
