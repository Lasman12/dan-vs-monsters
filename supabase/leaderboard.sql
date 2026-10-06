-- Public leaderboards: run this once in Supabase → SQL Editor.
-- Only names and one number per player are exposed; the saves table stays private (RLS).
-- kind: 'level' (furthest level reached), 'crowns' (purple crowns), 'ach' (achievements unlocked)
drop function if exists public.leaderboard(text);

create function public.leaderboard(kind text)
returns table (rank bigint, name text, value int)
language sql
stable
security definer
set search_path = public
as $$
  with v as (
    select s.name, s.updated_at,
      case kind
        when 'crowns' then (
          select coalesce(sum(x::numeric), 0)::int
          from jsonb_array_elements_text(case when jsonb_typeof(s.data->'crowns') = 'array' then s.data->'crowns' else '[]'::jsonb end) x)
        when 'ach' then (
          select count(*)::int
          from jsonb_object_keys(case when jsonb_typeof(s.data->'ach') = 'object' then s.data->'ach' else '{}'::jsonb end))
        else (
          select coalesce(max(m.i), 0)::int
          from jsonb_array_elements_text(case when jsonb_typeof(s.data->'medals') = 'array' then s.data->'medals' else '[]'::jsonb end) with ordinality m(x, i)
          where m.x::numeric > 0)
      end as value
    from saves s
    where s.name is not null
  )
  select rank() over (order by v.value desc), v.name, v.value
  from v
  where v.value > 0
  order by v.value desc, v.updated_at asc
  limit 50;
$$;

grant execute on function public.leaderboard(text) to anon, authenticated;
