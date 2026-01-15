-- Este arquivo é apenas para referência e deve ser executado no console do Supabase

-- Tabela para armazenar solicitações de parceria
create table public.partnership_requests (
  id uuid default uuid_generate_v4() primary key,
  cnpj text not null,
  institution_name text not null,
  email text not null,
  phone text not null,
  employees_range text not null,
  status text not null default 'pending',
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now(),
  contacted_at timestamp with time zone,
  contacted_by text
);

-- Comentários para documentação
comment on table public.partnership_requests is 'Solicitações de parceria de instituições';
comment on column public.partnership_requests.cnpj is 'CNPJ da instituição';
comment on column public.partnership_requests.institution_name is 'Nome da instituição';
comment on column public.partnership_requests.email is 'Email para contato';
comment on column public.partnership_requests.phone is 'Telefone para contato';
comment on column public.partnership_requests.employees_range is 'Faixa de quantidade de colaboradores';
comment on column public.partnership_requests.status is 'Status da solicitação: pending, contacted, approved, rejected';
comment on column public.partnership_requests.notes is 'Notas adicionais sobre a solicitação';
comment on column public.partnership_requests.contacted_at is 'Data e hora em que a instituição foi contatada';
comment on column public.partnership_requests.contacted_by is 'Usuário que contatou a instituição';

-- Políticas de segurança (RLS)
alter table public.partnership_requests enable row level security;

-- Permitir inserções anônimas (para o formulário público)
create policy "Permitir inserções anônimas" on public.partnership_requests
  for insert with check (true);

-- Apenas administradores podem visualizar e atualizar
create policy "Apenas administradores podem visualizar" on public.partnership_requests
  for select using (auth.role() = 'authenticated' and exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Apenas administradores podem atualizar" on public.partnership_requests
  for update using (auth.role() = 'authenticated' and exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));
