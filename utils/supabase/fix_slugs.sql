-- One-time fix for slugs created before utils/slugify.ts existed.
-- The old generator dropped č ć š ž đ: "Šarena salata" -> "arena-salata", "pečenja" -> "pe-enja".
--
-- Only rows whose slug is exactly what the OLD generator made from the title are changed.
-- Hand-edited slugs, and slugs whose new value would collide with another row, are left alone.
--
-- Run the whole file in the Supabase SQL Editor: it only shows a preview (STEP 2 is commented out).
-- If the list looks right, remove the /* and */ around STEP 2 and run the whole file again.

-- Same rules as utils/slugify.ts
create or replace function pg_temp.mk_slugify(t text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(
      replace(replace(t, 'Đ', 'dj'), 'đ', 'dj'),
      'čćšžČĆŠŽáàâäãéèêëíìîïóòôöõúùûüñçÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇ',
      'ccszccszaaaaaeeeeiiiiooooouuuuncaaaaaeeeeiiiiooooouuuunc'
    )),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

-- What the old admin code produced
create or replace function pg_temp.mk_old_slugify(t text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(t), '[^a-z0-9]+', '-', 'g'));
$$;


-- ─── STEP 1: preview (changes nothing) ──────────────────────────────────────
-- status: 'will change'  -> fixed by STEP 2
--         'hand-edited'  -> skipped, fix by hand in the admin panel if needed
--         'conflict'     -> skipped, new slug is already taken or shared by two rows

with c as (
  select 'posts' as tbl, id, title, slug as old_slug,
         pg_temp.mk_slugify(title) as new_slug,
         slug = pg_temp.mk_old_slugify(title) as auto_generated
  from public.posts
  union all
  select 'playlists', id, title, slug,
         pg_temp.mk_slugify(title),
         slug = pg_temp.mk_old_slugify(title)
  from public.playlists
)
select tbl, title, old_slug, new_slug,
  case
    when not auto_generated then 'hand-edited'
    when exists (select 1 from c c2 where c2.tbl = c.tbl and c2.old_slug = c.new_slug and c2.id <> c.id)
      or (select count(*) from c c2 where c2.tbl = c.tbl and c2.new_slug = c.new_slug and c2.auto_generated) > 1
      then 'conflict'
    else 'will change'
  end as status
from c
where old_slug is distinct from new_slug
order by tbl, status, title;


-- ─── STEP 2: apply ──────────────────────────────────────────────────────────
/*
begin;

with c as (
  select id, pg_temp.mk_slugify(title) as new_slug
  from public.posts
  where slug = pg_temp.mk_old_slugify(title)
    and slug <> pg_temp.mk_slugify(title)
)
update public.posts p
set slug = c.new_slug
from c
where p.id = c.id
  and not exists (select 1 from public.posts o where o.slug = c.new_slug and o.id <> c.id)
  and (select count(*) from c c2 where c2.new_slug = c.new_slug) = 1;

with c as (
  select id, pg_temp.mk_slugify(title) as new_slug
  from public.playlists
  where slug = pg_temp.mk_old_slugify(title)
    and slug <> pg_temp.mk_slugify(title)
)
update public.playlists p
set slug = c.new_slug
from c
where p.id = c.id
  and not exists (select 1 from public.playlists o where o.slug = c.new_slug and o.id <> c.id)
  and (select count(*) from c c2 where c2.new_slug = c.new_slug) = 1;

commit;
*/
