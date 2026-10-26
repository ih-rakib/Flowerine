# Flowerine Supabase setup

The GitHub Pages storefront remains static. Supabase provides the product database, admin authentication, inventory and saved order requests. Until these setup steps are completed, the current sample catalogue and email-request fallback remain in use.

## 1. Create and configure Supabase

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and the **publishable key** (or legacy anon key).
3. Edit `supabase-config.js` on `master` and replace both placeholders. These values are public browser configuration; never put a `service_role` key or database password in this file.
4. In the Supabase SQL Editor, run the migrations in order:
   - `supabase/migrations/202610260001_flowerine_store.sql`
   - `supabase/migrations/202610260002_atomic_order_inventory.sql`

## 2. Create the first admin

1. In **Authentication → Users**, create an account for the store owner.
2. Copy that user's UUID.
3. In the SQL Editor, run the following with the actual UUID:

```sql
insert into public.admin_users (user_id)
values ('REPLACE-WITH-AUTH-USER-UUID');
```

Only users in `admin_users` can use `admin.html` to manage products and view/update saved orders. Do not expose admin credentials to customers.

## 3. Deploy the order function

Install and sign in to the Supabase CLI, then link this project and deploy the function from the repository root:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-order --no-verify-jwt
```

The order function is public because customers do not sign in at checkout. It uses server-side Supabase environment variables and the SQL function `create_flowerine_order`, which calculates prices from database records, locks inventory rows, decrements stock and inserts the order in one transaction. Do not copy service-role credentials into this repository. If your deployment does not automatically provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, configure them in the Supabase Edge Function secrets dashboard.

**Before public production use:** add server-side rate limiting and CAPTCHA/bot protection to the public order function, review privacy/retention requirements for customer details, and test failed orders, stock races and email notifications. The current function saves the order but does not send an email notification by itself.

## 4. Bangladesh currency and WhatsApp

The storefront and admin dashboard display prices in Bangladeshi taka (BDT / ৳). Enter all product prices in BDT in the admin dashboard. Custom bouquet prices are Small ৳1,800, Medium ৳3,000 and Large ৳4,800, with optional wrapping at ৳400 or ৳800. The matching SQL function validates and calculates these amounts server-side, and saved orders record currency `BDT`.

The store WhatsApp number is configured in `supabase-config.js`. Customers must review and press Send in WhatsApp.

Before accepting orders, run `supabase/migrations/202610260003_bdt_currency.sql` in the Supabase SQL Editor so the database stores currency `BDT` and validates custom bouquet prices in taka.

## 5. Add real catalogue data

Sign in at `/Flowerine/admin.html`. Add products with the correct price, stock, categories and image URL. The storefront loads active products from Supabase when configured. Product prices in the existing HTML are sample/demo content until you replace them with your real catalogue.

## 6. Important behavior and limitations

- The checkout total is an estimate. There is no online payment processing.
- A successful Supabase order request creates a pending order and reserves/decrements available product stock. Admins can update the order status.
- Custom bouquet options use the size/wrapping prices encoded in the storefront and SQL function. Update both together if pricing changes.
- The existing FormSubmit email fallback remains for an unconfigured Supabase storefront; email-only requests are not written to the Supabase order table and do not appear in the admin dashboard.
- The browser key is not a secret; security relies on row-level security. Never disable RLS or publish the service-role key.
