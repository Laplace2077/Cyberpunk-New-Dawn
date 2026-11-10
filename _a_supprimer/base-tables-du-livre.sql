-- ============================================================
--  CYBERPUNK : NEW DAWN — les tables du livre dans la base
--
--  À coller dans Supabase : menu de gauche → « SQL Editor » →
--  « New query » → coller tout ce fichier → bouton « Run ».
--
--  À lancer APRÈS le premier script (celui des comptes), parce
--  qu'il se sert de la fonction est_admin() créée là-bas.
--
--  Le script est rejouable : tu peux le relancer plus tard sans
--  rien casser ni rien perdre.
-- ============================================================


-- ------------------------------------------------------------
--  LA TABLE
--
--  Une ligne par table du livre : « weapons », « cyberware »,
--  « univers »… Le contenu entier tient dans « donnees », sous
--  exactement la même forme que les fichiers de data/ : rien à
--  convertir, rien à découper.
--
--  Le dossier data/ reste en place et sert de référence. Cette
--  table ne contient que ce que tu as corrigé depuis le site :
--  une table absente d'ici est simplement lue dans le dossier.
-- ------------------------------------------------------------

create table if not exists public.tables (
  nom     text primary key,
  donnees jsonb not null,
  maj     timestamptz not null default now(),
  par     uuid references auth.users on delete set null
);

comment on table public.tables is
  'Les tables du livre corrigées en ligne. Ce qui n’est pas ici est lu dans data/.';


-- ------------------------------------------------------------
--  LES RÈGLES D'ACCÈS
--
--  Lecture ouverte à tous : le site est consultable sans compte,
--  et les tables du livre sont justement ce que tout le monde doit
--  pouvoir lire. Écriture réservée à l'administrateur — et c'est la
--  base elle-même qui l'impose, pas le site : même en bricolant la
--  page, un joueur ne peut rien changer aux règles.
-- ------------------------------------------------------------

alter table public.tables enable row level security;

drop policy if exists tables_lire on public.tables;
create policy tables_lire on public.tables
  for select to anon, authenticated
  using (true);

drop policy if exists tables_creer on public.tables;
create policy tables_creer on public.tables
  for insert to authenticated
  with check (public.est_admin());

drop policy if exists tables_maj on public.tables;
create policy tables_maj on public.tables
  for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

drop policy if exists tables_suppr on public.tables;
create policy tables_suppr on public.tables
  for delete to authenticated
  using (public.est_admin());


-- ------------------------------------------------------------
--  LES DROITS DE BASE
-- ------------------------------------------------------------

grant select on public.tables to anon, authenticated;
grant insert, update, delete on public.tables to authenticated;


-- ============================================================
--  C'EST TOUT.
--
--  Pour voir ce qui est passé en ligne, et ce que ça pèse :
--
--      select nom,
--             pg_size_pretty(length(donnees::text)::bigint) as poids,
--             maj
--        from public.tables
--       order by maj desc;
--
--  Pour remettre une table au dossier (le site la relira dans
--  data/ à la visite suivante) :
--
--      delete from public.tables where nom = 'weapons';
--
--  Pour tout remettre au dossier d'un coup :
--
--      delete from public.tables;
-- ============================================================
