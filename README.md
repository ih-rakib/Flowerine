# Flowerine 🌸

**Flowerine** is a responsive flower and bouquet storefront for browsing arrangements, building a custom bouquet, and submitting delivery requests in Bangladesh. It is published with GitHub Pages and can use Supabase for its live catalogue, inventory, admin authentication, and order requests.

- **Live storefront:** https://ih-rakib.github.io/Flowerine/
- **Store admin:** https://ih-rakib.github.io/Flowerine/admin.html
- **Repository:** https://github.com/ih-rakib/Flowerine
- **Detailed backend setup:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

> **Launch note:** Catalogue prices and some product images are sample content. Replace them with verified business details before accepting real customer orders. The checkout currently records order requests; it does not process online payments.

## Features

### Customer storefront
- Responsive flower and bouquet catalogue.
- Product search and category filters.
- Shopping bag/cart and checkout form.
- Custom bouquet options with size and wrapping choices.
- Bangladesh taka (BDT / ৳) price display.
- Delivery details and WhatsApp contact link.
- Flowerine SVG favicon.

### Store administration
- Supabase-authenticated admin sign-in.
- Product catalogue management, including prices, stock, categories and visibility.
- View saved order requests and update order status.
- Admin access controlled through the `public.admin_users` allow-list and database row-level security (RLS).

### Backend and automation
- Supabase Postgres tables for products, orders and admin users.
- Server-side order creation validates product prices, checks stock, decrements inventory and saves the order transactionally.
- GitHub Actions checks JavaScript syntax and runs repository preflight validation.
- GitHub Pages publishes the static website.

## Technology

- HTML5, CSS3 and vanilla JavaScript
- GitHub Pages and GitHub Actions
- Supabase Auth, Postgres, Row Level Security and Edge Functions
- Supabase JavaScript client
- SVG favicon

## Repository layout

```text
Flowerine/
├── index.html                         # Public storefront
├── style.css                          # Storefront styles
├── script.js                          # Catalogue, cart and checkout behavior
├── admin.html                         # Admin sign-in and dashboard
├── admin.css                          # Admin styles
├── admin.js                           # Admin dashboard behavior
├── favicon.svg                        # Browser tab icon
├── images/                            # Product and hero images
├── supabase-config.js                 # Public Supabase URL/key and store settings
├── SUPABASE_SETUP.md                  # Detailed backend setup and security notes
├── supabase/
│   ├── functions/create-order/         # Server-side order endpoint
│   └── migrations/                    # Database schema and updates
├── scripts/preflight.mjs              # Repository preflight checks
└── .github/workflows/                 # CI and deployment workflows
```

## Run locally

This is a static site; no frontend build step is required.

1. Clone or download the repository.
2. Open the project folder in a terminal.
3. Start a local static server, for example:

   ```sh
   python -m http.server 8000
   ```

4. Visit http://localhost:8000.

You can also open `index.html directly, but a local server is recommended for consistent browser behavior. Supabase-powered features will work only after backend configuration and setup.

## Configure Supabase

For the full instructions, including creating an admin user and deploying the order function, follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

High-level setup:

1. Create a Supabase project.
2. Put the project URL and browser-safe **publishable key** (or legacy anon key) in `supabase-config.js`.
3. In Supabase SQL Editor, run migrations in order:
   - `supabase/migrations/202610260001_flowerine_store.sql`
   - `supabase/migrations/202610260002_atomic_order_inventory.sql`
   - `supabase/migrations/202610260003_bdt_currency.sql`
   - `supabase/migrations/202610260004_seed_more_flowers.sql` *(optional sample products; safe to rerun)*
4. Create an Auth user for the store owner and add that user's UUID to `public.admin_users` as documented in the setup guide.
5. Deploy the `create-order` Supabase Edge Function and verify its server-side secrets are configured.
6. Open the admin page and replace sample products, prices, stock quantities and image URLs with actual catalogue data.

**Never place a Supabase service-role key, database password, or other secret in frontend files or commit them to GitHub.** The publishable/anon key is intended for browser use; database security depends on correct RLS policies and server-side validation.

## Catalogue and pricing notes

- All displayed prices are in **Bangladeshi taka (BDT / ৳)**.
- Custom bouquet base prices currently configured in the storefront and SQL function:
  - Small: ৳1,800
  - Medium: ৳3,000
  - Large: ৳4,800
  - Blush premium wrapping: +৳400
  - Luxe fabric wrapping: +৳800
  - Classic kraft wrapping: +৳0
- If custom bouquet prices change, update the storefront and server-side SQL function together.
- The optional fourth migration adds eight example products with demo prices and stock. It skips products whose names already exist; it does not update existing records.
- Ensure product image URLs are publicly accessible and verify that each image matches the product.

## Order and payment behavior

- Checkout totals are estimates and are recalculated on the server using database prices for listed products.
- Successful backend submissions create **pending** order requests and decrement stock within the database transaction.
- The admin dashboard can view saved orders and update their status.
- **Online payment processing is not implemented.** Do not advertise orders as paid based on submission alone.
- The current Edge Function does not send email notifications automatically.
- If Supabase is not configured, the storefront may use its existing email-request fallback. Those email-only requests are not saved in the Supabase admin order list.
- Before production use, test checkout end to end and add suitable rate limiting and bot protection to the public order endpoint. Review customer-data privacy, retention and access controls.

## Validation and deployment

GitHub Actions runs checks on pushes and pull requests targeting `master`. You can view results under the repository's **Actions** tab:

https://github.com/ih-rakib/Flowerine/actions

GitHub Pages deploys the static storefront from the repository's configured Pages workflow. Supabase Edge Function deployment is a separate workflow and requires the GitHub Actions secret `SUPABASE_ACCESS_TOKEN`.

## Before going live

- [ ] Replace demo catalogue prices, descriptions, stock and images.
- [ ] Confirm delivery coverage, fees, dates and customer contact details.
- [ ] Verify Supabase migrations and RLS policies are applied.
- [ ] Confirm only trusted accounts are in `public.admin_users`.
- [ ] Test successful, invalid and out-of-stock checkout attempts.
- [ ] Test on mobile and desktop, including the admin dashboard.
- [ ] Configure backups, monitoring, privacy practices and bot protection.
- [ ] Add and test a payment provider before offering online payments.

## License

No license is specified in this repository yet. Unless a license is added, reuse and redistribution are not automatically granted.
