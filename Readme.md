# Veloura — Luxury Restaurant Website

**Status: Phase 1 of a multi-phase build.** This drop includes the home page,
full design system, Supabase client, database schema with RLS, and project
structure. Remaining pages (menu, cart, checkout, auth, admin, gallery,
about, contact, reservation) follow in later phases — see "What's next."

## 1. Project Structure

```
/index.html          Home page (complete)
/menu.html            (phase 2)
/about.html            (phase 2)
/contact.html          (phase 2)
/gallery.html           (phase 2)
/reservation.html         (phase 2)
/login.html              (phase 2)
/signup.html              (phase 2)
/cart.html                 (phase 2)
/checkout.html               (phase 2)
/admin/                        (phase 3)
/css/style.css        Design tokens + all shared styles
/js/supabase-client.js  Supabase init + shared helpers
/js/main.js             Navbar, mobile menu, scroll reveal, newsletter
/js/index.js            Home page: fetch + render featured dishes
/sql/schema.sql        Full database schema + RLS policies + seed data
/images/                Placeholder folders (hero, menu, gallery, about, chef, logo)
```

## 2. Create the Supabase Project

1. Go to https://supabase.com and create a new project.
2. Wait for provisioning to finish (a couple of minutes).

## 3. Run the SQL Schema

1. In your Supabase project, open **SQL Editor**.
2. Paste the entire contents of `sql/schema.sql` and run it.
3. This creates all tables, RLS policies, the auto-profile trigger, and seeds the 11 menu categories.

## 4. Add Your Supabase URL and Key

1. In Supabase: **Project Settings > API**.
2. Copy the **Project URL** and **anon/public key**.
3. Open `js/supabase-client.js` and replace:
   ```js
   const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```
4. Never paste your `service_role` key into any frontend file — only the `anon` key belongs here.

## 5. Create the First Admin User

1. Sign up normally once phase 2's `signup.html` is live (or via Supabase Dashboard > Authentication > Add User for now).
2. In **SQL Editor**, run:
   ```sql
   update profiles set role = 'admin' where email = 'your-admin-email@example.com';
   ```
3. That user can now access the admin dashboard once phase 3 ships.

## 6. Add Menu Items

Once `admin/menu-management` ships (phase 3) you can add items from the UI.
For now, insert directly in SQL Editor:
```sql
insert into menu_items (category_id, name, description, price, is_popular, is_available)
values (
  (select id from categories where name = 'Main Course' limit 1),
  'Herb-Crusted Lamb Rack',
  'Rosemary jus, roasted root vegetables',
  4500,
  true,
  true
);
```
Set `is_popular = true` on up to 6 items to feature them in "Signature Creations" on the home page.

## 7. Replace Placeholder Images

Every placeholder is marked with an `IMAGE PLACEHOLDER` comment in the code:
- Hero background: `css/style.css` → `.hero-bg` (or swap for an `<img>`)
- About section: `css/style.css` → `.split-media`
- Dish images: stored per-row in `menu_items.image_url` (upload to Supabase Storage and paste the public URL)

Recommended: create a `menu-images` bucket in **Supabase Storage**, make it public, and store the returned URL in `image_url`.

## 8. Run the Website Locally

No build step — plain HTML/CSS/JS. Options:
- Open `index.html` directly in a browser, or
- Serve it locally for cleaner relative-path behavior:
  ```bash
  npx serve .
  # or
  python3 -m http.server 8000
  ```

## 9. Configure JazzCash / Easypaisa (Later)

Phase 2's `checkout.html` will include a payment-method selection UI for
JazzCash and Easypaisa, but **no live payment gateway is wired up yet** —
per the build rules, we don't fake a "payment successful" state. To go live:
1. Register as a merchant with JazzCash and/or Easypaisa.
2. Get your merchant ID, password, and integrity salt/keys.
3. Implement the redirect/callback flow server-side (this needs a small backend
   or a Supabase Edge Function — the anon key alone can't safely hold payment secrets).
4. Update `order.payment_status` based on the gateway's callback response.

## 10. Deploy

Any static host works (no server-side rendering needed):
- **Vercel / Netlify**: drag-and-drop the project folder or connect the git repo.
- **Supabase Storage** or **GitHub Pages** also work for a fully static deploy.
- Just make sure `js/supabase-client.js` has your real project URL/key before deploying.

## What's Next

Tell me to continue and I'll ship, in order:
1. `menu.html` (filterable/searchable menu, Supabase-driven) + `cart.html`
2. `checkout.html` + order placement/history + `login.html`/`signup.html`
3. `admin/` dashboard (overview, menu/order/reservation/customer/message management)
4. `about.html`, `gallery.html` (with lightbox), `contact.html`, `reservation.html`, `privacy.html`, `terms.html`