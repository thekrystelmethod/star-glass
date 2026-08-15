create table public.portrait_jobs (
  job_id uuid primary key,
  access_token_hash text not null
    check (access_token_hash ~ '^[0-9a-f]{64}$'),
  status text not null
    check (status in ('queued', 'working', 'ready', 'held', 'error')),
  record jsonb not null
    check (jsonb_typeof(record) = 'object')
    check (record->>'status' = status),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  expires_at timestamptz not null,
  check (updated_at >= created_at),
  check (expires_at > created_at)
);

comment on table public.portrait_jobs is
  'Ephemeral private-preview portrait jobs. Access only through StarGlass server functions using a per-job capability.';

alter table public.portrait_jobs enable row level security;
alter table public.portrait_jobs force row level security;

revoke all on table public.portrait_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.portrait_jobs to service_role;

create policy "StarGlass server manages portrait jobs"
on public.portrait_jobs
for all
to service_role
using (true)
with check (true);

create index portrait_jobs_expires_at_idx
  on public.portrait_jobs (expires_at);
