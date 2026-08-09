# Bourbon Cider Calculator

A small single-page app that scales a mulled bourbon cider recipe: give it a servings target
(or a fixed amount of cider), and it produces a shopping list and a per-batch cook recipe. The
bourbon ratio, serving size, batch size, and individual ingredient amounts are all adjustable.
Those inputs are saved to Supabase as one shared current recipe, so planning and shopping decisions
carry over to the cook view without re-entering anything or recalculating by hand.

## Stack

- Vue 3 + Vite, JS
- Tailwind v4 for utility styling
- Supabase for shared state
- Vitest for `calc.js`'s scaling/shopping/batch math

## Local setup

```sh
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
```

Without the Supabase env vars set, the app still runs but shows "Not connected to Supabase" and
won't persist changes.

## Supabase setup

1. Create a Supabase project (free tier is enough).
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor. It creates a single
   `recipe_state` table pinned to one row (`id = 1`) — this app stores one shared "current
   recipe," not a collection — with row-level security policies that let the anon key read and
   write that one row. There's no login: anyone with the anon key can read/write, which is fine
   for a low-stakes shared cider recipe with no sensitive data.
3. Copy the project URL and anon key into `.env` (locally) and into your Cloudflare Pages build
   environment variables (in production) — never commit real keys.

## Scripts

```sh
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npx vitest run    # run the calculation unit tests
```

## Project structure

- `src/lib/baseRecipe.js` — the immutable base recipe (per ½ gallon of cider) and defaults.
- `src/lib/calc.js` — pure scaling/shopping/batch math, no Vue or Supabase. Unit tested in
  `calc.test.js`.
- `src/lib/units.js` / `src/lib/display.js` — unit conversion and human-friendly formatting.
- `src/lib/recipeState.js` — the shared recipe state (planning inputs + ingredient overrides),
  synced to Supabase with debounced auto-save.
- `src/views/PlannerView.vue` — planning inputs and ingredient tweaks.
- `src/views/ShopView.vue` — the shopping list.
- `src/views/CookView.vue` — the per-batch recipe card. Keeps the screen awake while open
  (`src/lib/useWakeLock.js`).

The app has three tabs — Plan, Buy, Cook — with Plan shown by default.

## Deployment

Deployed via Cloudflare Pages from this GitHub repo:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Served at the site root, so Vite's default `/` base path needs no changes.
