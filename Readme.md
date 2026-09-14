# Veloura — Luxury Restaurant Website

**Status: complete.** Every page from the original spec is built — home,
menu, cart, checkout, auth, about, gallery, reservation, contact, legal
pages, and the full admin dashboard — all wired to Supabase.

## 1. Project Structure

```
/index.html              Home page
/menu.html               Full menu — search, category filters, sort, Supabase-driven
/about.html               Our Story / Philosophy / Chef / Ingredients / Restaurant / Why Veloura
/contact.html               Contact form -> Supabase, address/phone/hours placeholders, map placeholder
/gallery.html                 Category-filtered gallery with lightbox
/reservation.html               Reservation form -> Supabase
/login.html                       Supabase Auth login + forgot password
/signup.html                        Supabase Auth signup
/cart.html                            Cart (add/remove/qty/subtotal/delivery/total)
/checkout.html                          Delivery/pickup, COD/JazzCash/Easypaisa, order placement + confirmation
/privacy.html /terms.html                 Legal pages
/admin/                                     Restricted admin dashboard (see below)
/css/style.css            Design tokens + all shared + page-specific styles
/js/supabase-client.js    Supabase init + shared helpers (toast, friendlyError, auth helpers)
/js/main.js               Navbar, mobile menu, scroll reveal, cart badge, newsletter
/js/index.js               Home page: featured dishes
/js/menu.js                 Menu page logic
/js/cart.js                  Cart page logic
/js/checkout.js                Checkout + order placement
/js/auth.js                     Login/signup/logout/forgot-password
/js/gallery.js                   Lightbox + category filter
/js/reservation.js                Reservation form
/js/contact.js                      Contact form
/admin/js/admin-guard.js              Blocks non-admins from every admin page
/admin/js/overview.js                   Dashboard stats
/admin/js/menu-management.js              Menu item CRUD
/admin/js/orders.js                         Order list, search/filter, status updates
/admin/js/reservations.js                     Approve/reject/complete
/admin/js/customers.js                          Customer list + order counts
/admin/js/messages.js                             Contact messages, read/delete
/admin/js/newsletter.js                             Subscriber list
/sql/schema.sql            Full database schema + RLS policies + seed data
/images/                    Placeholder folders (hero, menu, gallery, about, chef, logo)
```

## Admin Dashboard

Every page under `/admin/` is guarded client-side by `admin-guard.js`, which
checks the logged-in user's `profiles.role`. Non-admins (or logged-out
visitors) see a restricted-access screen instead of the dashboard.
**This client-side check is a UX convenience, not your real security
boundary** — the actual protection is the `is_admin()` RLS policies in
`sql/schema.sql`, which is what actually stops a non-admin from reading or
writing admin-only data even if they bypass the frontend JavaScript.

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

1. Sign up via `signup.html` (or Supabase Dashboard > Authentication > Add User).
2. In **SQL Editor**, run:
   ```sql
   update profiles set role = 'admin' where email = 'your-admin-email@example.com';
   ```
3. Log in at `login.html`, then visit `/admin/index.html` — you'll now pass the admin guard.

## 6. Add Menu Items

Use the admin dashboard: `/admin/menu-management.html` → **Add Menu Item**.
Set "Mark as popular" on up to 6 items to feature them in "Signature
Creations" on the home page.

Or insert directly in SQL Editor:
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

## 7. Replace Placeholder Images

Every placeholder is marked with an `IMAGE PLACEHOLDER` comment in the code:
- Hero background: `css/style.css` → `.hero-bg` (or swap for an `<img>`)
- About section images: `css/style.css` → `.about-media` / `.split-media`
- Gallery: `js/gallery.js` → add an `image:` field per item and render it in `galleryItemTemplate()`
- Dish images: stored per-row in `menu_items.image_url` (set via the admin dashboard or Supabase Storage)

Recommended: create a `menu-images` bucket in **Supabase Storage**, make it public, and paste the returned URL into the admin "Image URL" field.

## 8. Run the Website Locally

No build step — plain HTML/CSS/JS.
```bash
npx serve .
# or
python3 -m http.server 8000
```

## 9. Configure JazzCash / Easypaisa (Later)

`checkout.html` includes a payment-method selection UI for JazzCash and
Easypaisa, but **no live payment gateway is wired up** — per the build
rules, we never fake a "payment successful" state. Orders placed with
these methods are stored with `payment_status = 'pending'` until you wire
up the real flow:
1. Register as a merchant with JazzCash and/or Easypaisa.
2. Get your merchant ID, password, and integrity salt/keys.
3. Implement the redirect/callback flow server-side — this needs a small
   backend or a Supabase Edge Function (the anon key alone can't safely
   hold payment secrets).
4. Update `orders.payment_status` based on the gateway's callback response
   (the admin Orders page already lets you do this manually in the meantime).

## 10. Deploy

Any static host works (no server-side rendering needed):
- **Vercel / Netlify**: drag-and-drop the project folder or connect the git repo.
- **GitHub Pages** also works for a fully static deploy.
- Just make sure `js/supabase-client.js` has your real project URL/key before deploying.
