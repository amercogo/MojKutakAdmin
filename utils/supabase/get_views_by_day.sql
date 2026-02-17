-- Create a function to get views by day for the last 7 days
create or replace function get_views_by_day(days_d int default 7)
returns table (
  date_d date,
  view_count bigint
)
language plpgsql
as $$
begin
  return query
  select
    date_trunc('day', viewed_at)::date as date_d,
    count(*) as view_count
  from
    page_views
  where
    viewed_at > now() - (days_d || ' days')::interval
  group by
    1
  order by
    1 asc;
end;
$$;
