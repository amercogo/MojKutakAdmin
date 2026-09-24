-- Views per day for the last `days_d` days (including today), in Sarajevo local time.
-- Every day in the range is returned, days without views get view_count = 0.
create or replace function get_views_by_day(days_d int default 7)
returns table (
  date_d date,
  view_count bigint
)
language sql
stable
as $$
  with bounds as (
    select (now() at time zone 'Europe/Sarajevo')::date as today
  ),
  views as (
    select
      (viewed_at at time zone 'Europe/Sarajevo')::date as day,
      count(*) as view_count
    from page_views, bounds
    where viewed_at >= ((bounds.today - (days_d - 1))::timestamp at time zone 'Europe/Sarajevo')
    group by 1
  )
  select
    d::date as date_d,
    coalesce(views.view_count, 0) as view_count
  from bounds
  cross join generate_series(bounds.today - (days_d - 1), bounds.today, interval '1 day') as d
  left join views on views.day = d::date
  order by 1 asc;
$$;
