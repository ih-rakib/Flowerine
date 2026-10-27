# Flowerine 🌸

**Flowerine is an online flower and bouquet shop concept built for customers in Bangladesh.** It gives visitors a simple way to explore floral arrangements, choose a bouquet, customize selected options, and send a delivery request. The project also includes an admin dashboard for managing the catalogue and submitted orders.

<p align="center">
  <a href="https://ih-rakib.github.io/Flowerine/"><strong>Visit Flowerine Storefront →</strong></a>
</p>

## Explore the project

- **Website:** https://ih-rakib.github.io/Flowerine/
- **Admin dashboard:** https://ih-rakib.github.io/Flowerine/admin.html
- **Source code:** https://github.com/ih-rakib/Flowerine

## What can you do with Flowerine?

### For customers
- Browse a collection of flower arrangements and bouquets.
- Search products and explore catalogue categories.
- Add products to a cart and submit delivery details.
- Customize a bouquet by choosing its size and wrapping options.
- View prices in Bangladeshi taka (BDT / ৳).
- Contact the store through WhatsApp.

### For store administrators
- Sign in through Supabase authentication.
- Add and manage products, prices, stock, categories and product visibility.
- Review saved order requests and update their status.

## How it works

Flowerine uses a lightweight static frontend hosted on GitHub Pages. Supabase provides the database and authentication for the connected catalogue and admin features. A Supabase Edge Function handles order requests and validates catalogue prices and stock on the server before saving an order.

**Current scope:** Checkout submits an order request; online payment processing is not included. Product catalogue entries and prices may be illustrative, depending on the configured data.

## Built with

- **Frontend:** HTML, CSS and vanilla JavaScript
- **Hosting and CI:** GitHub Pages and GitHub Actions
- **Backend:** Supabase Auth, PostgreSQL, Row Level Security and Edge Functions
- **Branding:** Custom SVG favicon

## Project structure

```text
Flowerine/
├── index.html                         # Customer storefront
├── style.css                          # Storefront styling
├── script.js                          # Catalogue, cart and checkout
├── product.html                       # Individual flower detail page
├── product-page.css                   # Responsive product detail styling
├── product-page.js                    # Product details and shared cart integration
├── admin.html                         # Admin dashboard page
├── admin.css                          # Admin dashboard styling
├── admin.js                           # Admin dashboard behavior
├── favicon.svg                        # Flowerine browser icon
├── images/                            # Product and website images
├── supabase-config.js                 # Public frontend configuration
├── SUPABASE_SETUP.md                  # Backend setup guide
├── supabase/
│   ├── functions/create-order/         # Order Edge Function
│   └── migrations/                    # Database schema and updates
├── scripts/preflight.mjs              # Project validation checks
└── .github/workflows/                 # Automated checks and deployment
```

## Run it locally

You can run the static storefront locally without a frontend build step.

1. Clone the repository:

   ```sh
   git clone https://github.com/ih-rakib/Flowerine.git
   cd Flowerine
   ```

2. Start a local web server:

   ```sh
   python -m http.server 8000
   ```

3. Open http://localhost:8000 in your browser.

Supabase-connected features require the project configuration and backend setup described in [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Backend setup

If you're interested in running your own instance or understanding the database setup, see **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**. It explains the migrations, admin access, order function deployment, currency settings and security considerations.

The browser configuration uses a Supabase publishable key (or legacy anon key). **Never put a service-role key, database password or other private secret in frontend code or commit one to the repository.**

## Development checks

GitHub Actions runs JavaScript syntax checks and repository preflight validation on pushes and pull requests targeting `master`.

- [View workflow runs](https://github.com/ih-rakib/Flowerine/actions)
- [Browse the source code](https://github.com/ih-rakib/Flowerine)

## Contributing

Suggestions and improvements are welcome. If you want to contribute, open an issue to discuss a change or submit a pull request with a clear description of what you changed.

## License

A license has not yet been specified. Until one is added to the repository, don't assume the code is available for unrestricted reuse or redistribution.
