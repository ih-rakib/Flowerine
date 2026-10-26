-- Add eight more Flowerine bouquets to the live catalogue (prices are demo BDT values).
-- Safe to rerun: existing products with these names are left unchanged.
do $$
begin
  insert into public.products (name, description, price, image_url, categories, stock, active)
  select v.name, v.description, v.price, v.image_url, v.categories, 10, true
  from (values
    ('Golden Sunrise Roses', 'Sunny yellow roses for brighter days', 3400::numeric, 'https://ih-rakib.github.io/Flowerine/images/pngwing5.png', array['bouquet', 'everyday']::text[]),
    ('Lavender Haze', 'Lilac tones with a dreamy, gentle feel', 3300::numeric, 'https://ih-rakib.github.io/Flowerine/images/pngwing6.png', array['bouquet', 'gift']::text[]),
    ('Ivory Elegance', 'Creamy whites for timeless, graceful moments', 3900::numeric, 'https://ih-rakib.github.io/Flowerine/images/pngwing7.png', array['bouquet', 'romance']::text[]),
    ('Ruby Red Romance', 'Deep red blooms made for heartfelt words', 4100::numeric, 'https://ih-rakib.github.io/Flowerine/images/pngwing2.png', array['bouquet', 'romance']::text[]),
    ('Pastel Petal Cloud', 'A soft pastel mix with a delicate finish', 3100::numeric, 'https://ih-rakib.github.io/Flowerine/images/flower2.png', array['bouquet', 'everyday']::text[]),
    ('Tropical Celebration', 'Bright, joyful colours for big news and birthdays', 3700::numeric, 'https://ih-rakib.github.io/Flowerine/images/pngwing8.png', array['gift', 'bouquet']::text[]),
    ('White Lily Serenity', 'A calm, elegant arrangement in soft whites', 3500::numeric, 'https://ih-rakib.github.io/Flowerine/images/pngwing4.png', array['everyday', 'gift']::text[]),
    ('Sunset Garden Mix', 'Warm peach and coral tones with garden charm', 3600::numeric, 'https://ih-rakib.github.io/Flowerine/images/flower3.png', array['bouquet', 'gift']::text[])
  ) as v(name, description, price, image_url, categories)
  where not exists (select 1 from public.products p where p.name = v.name);
end $$;
