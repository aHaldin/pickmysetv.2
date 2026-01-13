create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  original_artist text,
  lyrics text,
  backing_track_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position int not null default 0
);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_name text,
  event_date date,
  share_token text not null unique,
  base_setlist_id uuid references public.setlists(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_submissions (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  notes text
);

create table if not exists public.submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position int not null default 0
);

alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_items enable row level security;
alter table public.gigs enable row level security;
alter table public.client_submissions enable row level security;
alter table public.submission_items enable row level security;

create policy "Songs owner access" on public.songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Songs owner update" on public.songs
  for update using (auth.uid() = user_id);

create policy "Songs owner delete" on public.songs
  for delete using (auth.uid() = user_id);

create policy "Setlists owner access" on public.setlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Setlist items owner access" on public.setlist_items
  for all using (
    exists (
      select 1 from public.setlists s where s.id = setlist_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.setlists s where s.id = setlist_id and s.user_id = auth.uid()
    )
  );

create policy "Gigs owner access" on public.gigs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Gigs owner delete" on public.gigs
  for delete using (auth.uid() = user_id);

create policy "Submissions owner access" on public.client_submissions
  for all using (
    exists (
      select 1 from public.gigs g where g.id = gig_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gigs g where g.id = gig_id and g.user_id = auth.uid()
    )
  );

create policy "Submission items owner access" on public.submission_items
  for all using (
    exists (
      select 1
      from public.client_submissions cs
      join public.gigs g on g.id = cs.gig_id
      where cs.id = submission_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.client_submissions cs
      join public.gigs g on g.id = cs.gig_id
      where cs.id = submission_id and g.user_id = auth.uid()
    )
  );

create or replace function public.get_public_gig(p_share_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  gig_record record;
  songs_json jsonb;
  base_items jsonb;
  artist_email text;
begin
  select * into gig_record from public.gigs where share_token = p_share_token limit 1;
  if not found then
    return null;
  end if;

  select email into artist_email from auth.users where id = gig_record.user_id;

  select jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'originalArtist', s.original_artist,
      'lyrics', s.lyrics,
      'backingTrackUrl', s.backing_track_url
    ) order by lower(s.title)
  )
  into songs_json
  from public.songs s
  where s.user_id = gig_record.user_id;

  if gig_record.base_setlist_id is not null then
    select jsonb_agg(
      jsonb_build_object(
        'songId', s.id,
        'title', s.title,
        'originalArtist', s.original_artist,
        'position', si.position
      )
      order by si.position
    )
    into base_items
    from public.setlist_items si
    join public.songs s on s.id = si.song_id
    where si.setlist_id = gig_record.base_setlist_id;
  else
    base_items := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'gig', jsonb_build_object(
      'id', gig_record.id,
      'title', gig_record.title,
      'clientName', gig_record.client_name,
      'eventDate', gig_record.event_date,
      'shareToken', gig_record.share_token,
      'artistEmail', artist_email
    ),
    'songs', coalesce(songs_json, '[]'::jsonb),
    'baseSetlist', coalesce(base_items, '[]'::jsonb)
  );
end;
$$;

create or replace function public.submit_client_request(
  p_share_token text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  gig_id uuid;
  submission_id uuid;
  item jsonb;
begin
  select id into gig_id from public.gigs where share_token = p_share_token limit 1;
  if gig_id is null then
    raise exception 'Gig not found';
  end if;

  insert into public.client_submissions (gig_id, notes)
  values (gig_id, p_notes)
  returning id into submission_id;

  if p_items is not null then
    for item in select * from jsonb_array_elements(p_items)
    loop
      insert into public.submission_items (submission_id, song_id, position)
      values (
        submission_id,
        (item ->> 'songId')::uuid,
        coalesce((item ->> 'position')::int, 0)
      );
    end loop;
  end if;

  return submission_id;
end;
$$;

grant execute on function public.get_public_gig(text) to anon, authenticated;
grant execute on function public.submit_client_request(text, text, jsonb) to anon, authenticated;

create or replace function public.can_access_gig(p_token text, p_artist uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gigs g
    where g.share_token = p_token
      and g.user_id = p_artist
  );
$$;

create policy "Public gig by token" on public.gigs
  for select
  using (
    share_token = (current_setting('request.headers', true)::json->>'x-gig-token')
  );

create policy "Songs by gig token" on public.songs
  for select
  using (
    public.can_access_gig(
      (current_setting('request.headers', true)::json->>'x-gig-token'),
      user_id
    )
  );

create policy "Public submit by token" on public.client_submissions
  for insert
  with check (
    exists (
      select 1
      from public.gigs g
      where g.id = gig_id
        and g.share_token = (current_setting('request.headers', true)::json->>'x-gig-token')
    )
  );

create policy "Public submission items by token" on public.submission_items
  for insert
  with check (
    exists (
      select 1
      from public.client_submissions cs
      join public.gigs g on g.id = cs.gig_id
      where cs.id = submission_id
        and g.share_token = (current_setting('request.headers', true)::json->>'x-gig-token')
    )
  );
