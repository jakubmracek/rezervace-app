-- ==============================================
-- REZERVAČNÍ SYSTÉM – Supabase schema
-- Spusť celý tento soubor v Supabase SQL Editoru
-- ==============================================

-- Tabulka událostí (každá "akce" je jeden záznam)
create table public.events (
  id          uuid default gen_random_uuid() primary key,
  slug        text unique not null,           -- URL-friendly název, např. "tripartity-2026"
  name        text not null,                  -- Zobrazovaný název
  description text,                           -- Volitelný popis
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Termíny patřící k události
create table public.slots (
  id             uuid default gen_random_uuid() primary key,
  event_id       uuid references public.events(id) on delete cascade not null,
  label          text not null,               -- Např. "Úterý 11. 11., 14:00–14:20"
  starts_at      timestamptz,                 -- Pro ICS export
  ends_at        timestamptz,
  capacity       int not null default 1,      -- Kolik lidí na jeden slot
  reserved_count int not null default 0,      -- Automaticky inkrementováno
  created_at     timestamptz default now()
);

-- Dynamická pole formuláře (různá akce = různá pole)
create table public.event_fields (
  id         uuid default gen_random_uuid() primary key,
  event_id   uuid references public.events(id) on delete cascade not null,
  key        text not null,                   -- Technický klíč, např. "email"
  label      text not null,                   -- Zobrazovaný popisek
  field_type text not null default 'text',    -- text | email | tel | textarea
  required   boolean default true,
  sort_order int default 0,
  unique(event_id, key)
);

-- Rezervace
create table public.reservations (
  id         uuid default gen_random_uuid() primary key,
  event_id   uuid references public.events(id) not null,
  slot_id    uuid references public.slots(id) not null,
  data       jsonb not null default '{}',     -- Flexibilní data formuláře
  created_at timestamptz default now()
);

-- ==============================================
-- Atomická funkce pro rezervaci (zabraňuje přebukování)
-- ==============================================
create or replace function public.make_reservation(
  p_slot_id  uuid,
  p_event_id uuid,
  p_data     jsonb
) returns json as $$
declare
  v_slot        public.slots;
  v_reservation public.reservations;
begin
  -- Zamkni řádek slotu
  select * into v_slot
  from public.slots
  where id = p_slot_id
  for update;

  if not found then
    return json_build_object('error', 'Termín neexistuje.');
  end if;

  if v_slot.reserved_count >= v_slot.capacity then
    return json_build_object('error', 'Termín byl právě obsazen. Vyberte jiný.');
  end if;

  -- Inkrement
  update public.slots
  set reserved_count = reserved_count + 1
  where id = p_slot_id;

  -- Ulož rezervaci
  insert into public.reservations (event_id, slot_id, data)
  values (p_event_id, p_slot_id, p_data)
  returning * into v_reservation;

  return json_build_object('success', true, 'reservation_id', v_reservation.id);
end;
$$ language plpgsql security definer;

-- ==============================================
-- Realtime na slots (pro live aktualizace)
-- ==============================================
alter publication supabase_realtime add table public.slots;

-- ==============================================
-- Row Level Security
-- ==============================================
alter table public.events        enable row level security;
alter table public.slots         enable row level security;
alter table public.event_fields  enable row level security;
alter table public.reservations  enable row level security;

-- Veřejné čtení aktivních událostí
create policy "Public read active events"
  on public.events for select using (active = true);

-- Veřejné čtení slotů a polí
create policy "Public read slots"
  on public.slots for select using (true);
create policy "Public read fields"
  on public.event_fields for select using (true);

-- Veřejný insert rezervací (přes RPC funkci)
create policy "Public insert reservations"
  on public.reservations for insert with check (true);

-- Admin (přihlášený uživatel) může vše
create policy "Auth manage events"
  on public.events for all using (auth.role() = 'authenticated');
create policy "Auth manage slots"
  on public.slots for all using (auth.role() = 'authenticated');
create policy "Auth manage fields"
  on public.event_fields for all using (auth.role() = 'authenticated');
create policy "Auth read reservations"
  on public.reservations for select using (auth.role() = 'authenticated');
