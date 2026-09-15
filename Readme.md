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

**If you ever re-run this script** on a database where it already ran once
(e.g. you added a column by hand and want to reapply), you'll get errors
like `policy "..." already exists` — `CREATE POLICY` isn't safe to run
twice. If that happens, either:
- Drop the specific policy first: `drop policy if exists "policy name here" on table_name;`, then re-run, or
- Only run the specific section you actually need to re-apply, instead of the whole file.

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

## 11. Deploy to Vercel & Connect Supabase

Veloura is a static site, so Vercel just needs to serve the files — Supabase
is the backend, reached directly from the browser via the anon key.

1. **Push the project to GitHub** (or GitLab/Bitbucket) as its own repo.
2. **Set your real Supabase URL/key first** — before deploying, open
   `js/supabase-client.js` and replace `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   with your project's values (see steps 2–4 above), then commit.
3. **Import the repo in Vercel**: [vercel.com/new](https://vercel.com/new) → select the repo.
4. **Framework Preset**: choose "Other" (no build step needed — it's plain HTML/CSS/JS).
   - Build Command: leave empty
   - Output Directory: leave as `.` (project root)
5. Click **Deploy**. Vercel gives you a `https://your-project.vercel.app` URL.
6. **Tell Supabase about your new domain** (required for auth to work correctly):
   - Supabase Dashboard → **Authentication → URL Configuration**
   - Set **Site URL** to your Vercel URL (e.g. `https://veloura.vercel.app`)
   - Add the same URL (and `http://localhost:8000` if you test locally) under **Redirect URLs**
   - This is what makes password-reset links and email confirmations redirect back to the right place.
7. Every `git push` to your main branch auto-redeploys on Vercel — no extra config needed since there's no build step to break.

If you'd rather not commit real keys to a public repo: keep the repo
private, or add a Vercel **Environment Variable** and a tiny build step that
injects it into `supabase-client.js` at build time — not required for a
first deploy, since the anon key is safe to expose publicly (RLS is what
actually protects your data).

## 12. Admin Login & Changing Admin Credentials

Every page under `/admin/` now asks for **email + password directly on
the page** (no redirect to a separate login screen) — if you're not
signed in as an admin, you'll see an inline sign-in form right where the
dashboard would be.

**To change the admin's login email or password later:**

- **Password** — there's no safe way to set a password via plain SQL
  (Supabase stores a salted hash, not the password itself). Use either:
  - Supabase Dashboard → **Authentication → Users** → click the admin user → **Send password recovery**, or **Reset Password** directly, or
  - Have the admin use the "Forgot password?" link on `login.html`.
- **Email** — Dashboard → **Authentication → Users** → click the user → edit email (this updates `auth.users` and keeps everything in sync, including confirmation state).
- **Full name / role** — these live in your own `profiles` table and can be changed directly in SQL Editor:
  ```sql
  update profiles set full_name = 'New Name' where email = 'admin@example.com';
  ```
- **To promote a different user to admin** (or demote one):
  ```sql
  update profiles set role = 'admin' where email = 'someone@example.com';
  update profiles set role = 'customer' where email = 'someone-else@example.com';
  ```

## 13. Managing the Restaurant from the Admin Dashboard

The admin dashboard (`/admin/`) now covers the whole restaurant:

- **Overview** — live stats: total orders, today's orders, total customers, total revenue, pending orders, pending reservations.
- **Menu Management** — add/edit/delete dishes, set price/category/availability/popular/vegetarian, and **upload a photo directly** (drag a file in — it's uploaded to Supabase Storage and linked automatically, no need to host images elsewhere).
- **Categories** *(new)* — add/edit/delete menu categories, each with its own optional image.
- **Deals** *(new)* — create, modify, or delete special offers. Each deal can optionally link to a specific menu item and a discount percentage, plus a start/end date and its own image. Any deal marked **Active** (and within its date range) automatically replaces the static "A Taste Worth Celebrating" banner on the home page — the most recently created active deal is shown.
- **Orders** — search/filter, and update order status or payment status inline.
- **Reservations** — approve, reject, or mark completed.
- **Customers** — registered customers and how many orders each has placed.
- **Contact Messages** — read/delete messages submitted via the contact form.
- **Newsletter** — see who's subscribed.

**Image uploads** go to a public `veloura-images` bucket created by
`sql/schema.sql` (with RLS policies so only admins can upload/modify —
everyone can view). If you ever see an upload fail with a permissions
error, double check you ran the full, latest `sql/schema.sql` (the bucket
and its policies are near the bottom of the file).
