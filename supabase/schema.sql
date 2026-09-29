-- =====================================================================
-- Schéma "Nos Vins" — à exécuter dans Supabase (SQL Editor > New query)
-- =====================================================================

-- Type de vin
do $$ begin
  create type wine_type as enum ('rouge', 'blanc', 'rose', 'gris', 'petillant', 'liquoreux');
exception
  when duplicate_object then null;
end $$;

-- Un profil par utilisateur (créé après la connexion anonyme + choix du pseudo)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  created_at timestamptz not null default now()
);

-- Fiche d'un vin (informations partagées, éditables par tous les membres)
create table if not exists wines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  producer text,
  type wine_type not null default 'rouge',
  vintage int,
  region text,
  country text,
  -- Texte libre (pas de liste fermée) pour couvrir les désignations étrangères :
  -- DOCG/DOC/IGT (Italie), DOCa/DO (Espagne), AVA (États-Unis), etc.
  appellation_type text,
  appellation_name text,
  grape_varieties text,
  price numeric,
  photo_url text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration pour une base déjà créée avant l'ajout de la mention/pays
alter table wines add column if not exists appellation_type text;
alter table wines add column if not exists appellation_name text;
alter table wines add column if not exists country text;
-- Une contrainte antérieure limitait la mention aux seules désignations
-- françaises ; on la retire pour permettre les vins étrangers (DOCG, DO, AVA…).
alter table wines drop constraint if exists wines_appellation_type_check;

-- Une dégustation = la note + les paramètres de dégustation d'UN utilisateur pour UN vin
create table if not exists tastings (
  id uuid primary key default gen_random_uuid(),
  wine_id uuid not null references wines (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  note numeric(2, 1) check (note >= 0 and note <= 5),
  robe_couleur text,
  robe_intensite text,
  robe_limpidite text,
  nez_intensite text,
  nez_qualite text,
  nez_aromes text,
  bouche_attaque text,
  bouche_tanins text,
  bouche_acidite text,
  bouche_sucrosite text,
  bouche_corps text,
  bouche_longueur text,
  bouche_equilibre text,
  appreciation text,
  accord_mets text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wine_id, user_id)
);

-- Commentaires libres sur une fiche, visibles par tous
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  wine_id uuid not null references wines (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security — tout le monde connecté (même en anonyme) peut lire ;
-- chacun ne peut modifier que ses propres dégustations/commentaires/profil.
-- Les fiches "wines" sont modifiables par tous les membres (usage partagé).
-- =====================================================================

alter table profiles enable row level security;
alter table wines enable row level security;
alter table tastings enable row level security;
alter table comments enable row level security;

drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select using (true);
drop policy if exists "profiles_upsert_own" on profiles;
create policy "profiles_upsert_own" on profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

drop policy if exists "wines_select_all" on wines;
create policy "wines_select_all" on wines for select using (true);
drop policy if exists "wines_insert_auth" on wines;
create policy "wines_insert_auth" on wines for insert with check (auth.uid() is not null);
drop policy if exists "wines_update_auth" on wines;
create policy "wines_update_auth" on wines for update using (auth.uid() is not null);
drop policy if exists "wines_delete_auth" on wines;
create policy "wines_delete_auth" on wines for delete using (auth.uid() is not null);

drop policy if exists "tastings_select_all" on tastings;
create policy "tastings_select_all" on tastings for select using (true);
drop policy if exists "tastings_insert_own" on tastings;
create policy "tastings_insert_own" on tastings for insert with check (auth.uid() = user_id);
drop policy if exists "tastings_update_own" on tastings;
create policy "tastings_update_own" on tastings for update using (auth.uid() = user_id);
drop policy if exists "tastings_delete_own" on tastings;
create policy "tastings_delete_own" on tastings for delete using (auth.uid() = user_id);

drop policy if exists "comments_select_all" on comments;
create policy "comments_select_all" on comments for select using (true);
drop policy if exists "comments_insert_own" on comments;
create policy "comments_insert_own" on comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_delete_own" on comments;
create policy "comments_delete_own" on comments for delete using (auth.uid() = user_id);

-- =====================================================================
-- Realtime — active la réplication pour la mise à jour en direct
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wines') then
    alter publication supabase_realtime add table wines;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tastings') then
    alter publication supabase_realtime add table tastings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments') then
    alter publication supabase_realtime add table comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table profiles;
  end if;
end $$;

-- =====================================================================
-- Storage — bucket public pour les photos d'étiquettes
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('labels', 'labels', true)
on conflict (id) do nothing;

drop policy if exists "labels_public_read" on storage.objects;
create policy "labels_public_read" on storage.objects
  for select using (bucket_id = 'labels');

drop policy if exists "labels_auth_insert" on storage.objects;
create policy "labels_auth_insert" on storage.objects
  for insert with check (bucket_id = 'labels' and auth.uid() is not null);

drop policy if exists "labels_auth_update" on storage.objects;
create policy "labels_auth_update" on storage.objects
  for update using (bucket_id = 'labels' and auth.uid() is not null);

drop policy if exists "labels_auth_delete" on storage.objects;
create policy "labels_auth_delete" on storage.objects
  for delete using (bucket_id = 'labels' and auth.uid() is not null);
