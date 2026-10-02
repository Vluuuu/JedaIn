-- Departure amounts authored by TO are travel costs, not final package prices.
-- Missing departureCostPerPerson remains a legacy final-price option.
create or replace function public.enforce_package_departure_options()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  option jsonb;
  priced_options jsonb := '[]';
  ids text[] := '{}';
  option_id text;
  min_price integer;
  cost numeric;
  final_price numeric;
  shared_price numeric;
  has_costs boolean;
  submitted boolean := new.status not in ('DRAFT','REJECTED');
begin
  if tg_op = 'UPDATE' and old.status not in ('DRAFT','REJECTED')
    and new.departure_options is distinct from old.departure_options then
    raise exception 'Perubahan titik keberangkatan paket disetujui memerlukan draf baru.';
  end if;
  if new.departure_options is null then return new; end if;
  if jsonb_typeof(new.departure_options) is distinct from 'array' then
    raise exception 'Titik keberangkatan wajib berupa daftar.';
  end if;
  if submitted and jsonb_array_length(new.departure_options) = 0 then
    raise exception 'Tambahkan minimal satu titik keberangkatan sebelum submit.';
  end if;
  select exists (select 1 from jsonb_array_elements(new.departure_options) o
    where o ? 'departureCostPerPerson') into has_costs;
  if has_costs then
    if new.eo_margin is null or new.eo_margin < 0 then
      raise exception 'Margin TO wajib berupa Rupiah utuh dan tidak negatif.';
    end if;
    if tg_op = 'INSERT' or old.status in ('DRAFT','REJECTED') then
      select d.base_cost_per_person,
        case when new.guide_source = 'DESTINATION' then coalesce(d.local_guide_fee_per_person,0) else 0 end
      into new.destination_base_cost, new.local_guide_fee
      from public.destinations d where d.id = new.destination_id;
      if not found then raise exception 'Data resmi destinasi tidak tersedia.'; end if;
    end if;
    shared_price := new.destination_base_cost::numeric + new.local_guide_fee::numeric + new.eo_margin::numeric;
    if shared_price is null or shared_price < 0 or shared_price > 2147483647 then
      raise exception 'Biaya bersama paket tidak valid.';
    end if;
  end if;
  for option in select value from jsonb_array_elements(new.departure_options) loop
    if jsonb_typeof(option) is distinct from 'object'
      or jsonb_typeof(option -> 'id') is distinct from 'string'
      or coalesce(trim(option ->> 'id'),'') = ''
      or jsonb_typeof(option -> 'areaLabel') is distinct from 'string'
      or jsonb_typeof(option -> 'meetingPointLabel') is distinct from 'string'
      or jsonb_typeof(option -> 'departureTimeLabel') is distinct from 'string'
      or jsonb_typeof(option -> 'pricePerPerson') is distinct from 'number'
      or (option ->> 'pricePerPerson') !~ '^[0-9]+$'
      or (option ->> 'pricePerPerson')::numeric > 2147483647 then
      raise exception 'Format titik keberangkatan atau harga tidak valid.';
    end if;
    option_id := option ->> 'id';
    if option_id = any(ids) then raise exception 'ID titik keberangkatan wajib unik.'; end if;
    ids := array_append(ids, option_id);
    if option ? 'departureCostPerPerson' then
      if option -> 'departureCostPerPerson' = 'null'::jsonb then
        if submitted then raise exception 'Isi biaya keberangkatan sebelum submit.'; end if;
        final_price := 0;
      else
        if jsonb_typeof(option -> 'departureCostPerPerson') is distinct from 'number'
          or (option ->> 'departureCostPerPerson') !~ '^[0-9]+$' then
          raise exception 'Biaya keberangkatan wajib berupa Rupiah utuh dan tidak negatif.';
        end if;
        cost := (option ->> 'departureCostPerPerson')::numeric;
        final_price := shared_price + cost;
        if final_price > 2147483647 then raise exception 'Harga paket terlalu besar.'; end if;
      end if;
      option := jsonb_set(option, '{pricePerPerson}', to_jsonb(final_price::integer));
    end if;
    if submitted and (trim(option ->> 'areaLabel') = ''
      or trim(option ->> 'meetingPointLabel') = ''
      or trim(option ->> 'departureTimeLabel') = ''
      or (option ->> 'pricePerPerson')::integer <= 0) then
      raise exception 'Lengkapi area, titik kumpul, waktu, dan harga positif sebelum submit.';
    end if;
    if (option ->> 'pricePerPerson')::integer > 0 then
      min_price := least(min_price, (option ->> 'pricePerPerson')::integer);
    end if;
    priced_options := priced_options || jsonb_build_array(option);
  end loop;
  if tg_op = 'UPDATE' and old.status not in ('DRAFT','REJECTED')
    and (priced_options is distinct from old.departure_options
      or (has_costs and (new.destination_base_cost,new.local_guide_fee,new.eo_margin,new.guide_source,new.destination_id)
        is distinct from (old.destination_base_cost,old.local_guide_fee,old.eo_margin,old.guide_source,old.destination_id))) then
    raise exception 'Perubahan harga paket disetujui memerlukan draf baru.';
  end if;
  new.departure_options := priced_options;
  new.customer_price := coalesce(min_price,0);
  return new;
end; $$;
revoke all on function public.enforce_package_departure_options() from public, anon, authenticated;

-- Adopt the clarified meaning only for editable drafts. Approved/Live packages
-- and previously agreed booking snapshots retain their existing prices.
update public.packages p
set departure_options = (
  select jsonb_agg(case when option ? 'departureCostPerPerson' then option
    else option || jsonb_build_object('departureCostPerPerson',
      case when (option ->> 'pricePerPerson')::integer > 0 then option -> 'pricePerPerson' else 'null'::jsonb end)
    end order by ordinal)
  from jsonb_array_elements(p.departure_options) with ordinality as opts(option,ordinal)
)
where p.status in ('DRAFT','REJECTED')
  and jsonb_typeof(p.departure_options) = 'array'
  and exists (select 1 from jsonb_array_elements(p.departure_options) o where not (o ? 'departureCostPerPerson'));
