-- Atomic order placement: validates server-side prices, locks stock rows, decrements stock and saves order in one transaction.
create or replace function public.create_flowerine_order(
  p_customer_name text, p_email text, p_phone text, p_delivery_address text,
  p_delivery_date date, p_occasion text, p_notes text, p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  qty integer;
  unit_price numeric(10,2);
  line_items jsonb := '[]'::jsonb;
  subtotal numeric(10,2) := 0;
  order_row public.orders%rowtype;
  item_id text;
  details jsonb;
  size_price numeric(10,2);
  wrap_price numeric(10,2);
begin
  if p_customer_name is null or length(trim(p_customer_name)) not between 1 and 100
     or p_email is null or length(p_email) > 160
     or p_phone is null or length(trim(p_phone)) not between 1 and 40
     or p_delivery_address is null or length(trim(p_delivery_address)) not between 1 and 600
     or p_occasion is null or length(trim(p_occasion)) not between 1 and 80
     or p_delivery_date < current_date then
    raise exception 'Invalid order details' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Invalid order items' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_items) loop
    item_id := coalesce(item->>'id','');
    qty := (item->>'quantity')::integer;
    if qty < 1 or qty > 99 then raise exception 'Invalid item quantity' using errcode = '22023'; end if;

    if item_id like 'custom-%' then
      details := coalesce(item->'details','{}'::jsonb);
      size_price := case details->>'size' when 'Small' then 18 when 'Medium' then 30 when 'Large' then 48 else null end;
      wrap_price := case details->>'wrapping' when 'Classic kraft' then 0 when 'Blush premium' then 4 when 'Luxe fabric' then 8 else null end;
      if size_price is null or wrap_price is null then raise exception 'Invalid custom bouquet options' using errcode = '22023'; end if;
      unit_price := size_price + wrap_price;
      line_items := line_items || jsonb_build_array(jsonb_build_object(
        'name','Custom Bouquet','quantity',qty,'unit_price',unit_price,
        'details',jsonb_build_object('style',left(coalesce(details->>'style',''),80),
          'size',details->>'size','wrapping',details->>'wrapping',
          'colour',left(coalesce(details->>'colour',''),80),
          'cardMessage',left(coalesce(details->>'cardMessage',''),240))));
    else
      select * into product_row from public.products where id = item_id::uuid and active = true for update;
      if not found then raise exception 'A selected product is unavailable' using errcode = 'P0002'; end if;
      if product_row.stock < qty then raise exception 'Insufficient stock for %', product_row.name using errcode = 'P0001'; end if;
      unit_price := product_row.price;
      update public.products set stock = stock - qty, updated_at = now() where id = product_row.id;
      line_items := line_items || jsonb_build_array(jsonb_build_object('id',product_row.id,'name',product_row.name,'quantity',qty,'unit_price',unit_price));
    end if;
    subtotal := subtotal + unit_price * qty;
  end loop;

  if subtotal > 1000000 then raise exception 'Order total is invalid' using errcode = '22023'; end if;
  insert into public.orders(customer_name,email,phone,delivery_address,delivery_date,occasion,notes,items,estimated_subtotal,status)
  values(trim(p_customer_name),lower(trim(p_email)),trim(p_phone),trim(p_delivery_address),p_delivery_date,
    trim(p_occasion),left(coalesce(p_notes,''),600),line_items,subtotal,'pending')
  returning * into order_row;
  return jsonb_build_object('id',order_row.id,'status',order_row.status,'estimated_subtotal',order_row.estimated_subtotal);
end;
$$;
revoke all on function public.create_flowerine_order(text,text,text,text,date,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_flowerine_order(text,text,text,text,date,text,text,jsonb) to service_role;
