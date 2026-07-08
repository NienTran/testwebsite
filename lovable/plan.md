
# Mikan Money Blog — Implementation Plan

A calm, Japanese-minimal Vietnamese educational blog covering digital skills, online income education, blockchain/crypto, airdrop news, tech tips, and finance news. Neutral, risk-aware tone (no guaranteed-income claims).

## Scope

Full application: public reading experience + auth + admin/author dashboard, backed by Lovable Cloud (Supabase). Vietnamese UI throughout.

## Design system

- Japanese minimal aesthetic: generous whitespace, thin dividers, restrained palette.
- Neutral tokens in `oklch`: off-white paper background, warm charcoal text, subtle "sumi ink" borders, a single muted accent (soft persimmon/mikan orange) used sparingly.
- Typography: Noto Serif JP for headings, Inter for body (loaded via `<link>` in `__root.tsx`).
- Light/dark theme toggle with `localStorage` persistence (`useEffect`-hydrated to avoid SSR mismatch).
- All colors as semantic tokens in `src/styles.css` — no hardcoded color classes in components.

## Backend (Lovable Cloud)

Enable Cloud, then migrate:

- `profiles` (id → auth.users, display_name, avatar_url, bio)
- `app_role` enum: `admin | author | user`
- `user_roles` (user_id, role) with `has_role()` security-definer
- `categories` (id, slug, name, description)
- `tags` (id, slug, name)
- `posts` (id, author_id, category_id, slug, title, excerpt, cover_image, content_md, meta_title, meta_description, canonical_url, status: draft|published, published_at, reading_time)
- `post_tags` (post_id, tag_id)
- `comments` (id, post_id, author_id, body, status: visible|hidden, created_at)
- `bookmarks` (user_id, post_id)

RLS: public SELECT on published posts / categories / tags / visible comments; authenticated users insert comments/bookmarks; authors manage own posts; admins manage everything (via `has_role`). Auto-create profile + default `user` role on signup via trigger. GRANTs on every public table. Seed Vietnamese demo content in the migration.

## Auth

Email/password + Google sign-in (via Lovable broker). Public routes at top level; protected surfaces under `_authenticated/` (integration-managed layout). Sign-in / sign-up at `/auth`; `onAuthStateChange` wired once in `__root.tsx`.

## Routes

Public:
- `/` — hero, latest, featured, category cards, popular, tag cloud, newsletter mock
- `/blog` — search + category/tag filters + sort
- `/post/$slug` — article, TOC, breadcrumbs, share, related, comments (login-gated)
- `/category/$slug`, `/tag/$slug`
- `/about`, `/contact`
- `/auth` (sign-in/up tabs)
- `/sitemap.xml`, `/robots.txt`

Authenticated:
- `/_authenticated/profile` — profile + bookmarks
- `/_authenticated/dashboard` — overview cards
- `/_authenticated/dashboard/posts` — table (author sees own, admin sees all)
- `/_authenticated/dashboard/posts/new`, `/edit/$id` — editor
- `/_authenticated/dashboard/comments` — moderation (admin)
- `/_authenticated/dashboard/users` — role management (admin)

404 via root `notFoundComponent`.

## SEO

- Per-route `head()` with title, description, og:*, twitter:*; leaf routes add og:image.
- Canonical + `og:url` self-referencing (relative paths).
- JSON-LD: Organization on `__root`, BlogPosting + BreadcrumbList on post pages.
- Semantic HTML (`article`, `header`, `main`, `nav`, `footer`), lazy images, breadcrumbs.
- `sitemap.xml` server route enumerating static routes + published posts; `robots.txt`.

## Server functions

Public reads (published posts, categories, tags, comments) via server publishable client. Authenticated writes (create/update/delete post, comment, bookmark, role changes) via `requireSupabaseAuth` + role check. All under `src/lib/*.functions.ts`.

## Data flow

TanStack Query throughout: `ensureQueryData` in loaders, `useSuspenseQuery` in components. Mutations invalidate matching keys. Toast notifications on success/error.

## Deliverables in this build

1. Enable Lovable Cloud.
2. Migration: schema, RLS, GRANTs, triggers, seed data.
3. Design tokens + fonts in `styles.css` and `__root.tsx`.
4. Layout: header (logo, nav, search, theme toggle, auth menu), footer.
5. All public routes with real data.
6. Auth flow (email + Google).
7. Author/admin dashboard with post editor, comment moderation, user roles.
8. SEO helpers, sitemap, robots.
9. Vietnamese copy throughout, empty/loading/error states.

## Notes / assumptions

- "Newsletter" is a mock (email captured to a table, no delivery).
- Rich text = markdown rendered with `react-markdown` + `remark-gfm` (lighter than a WYSIWYG, fits minimal aesthetic).
- Cover images = URL field (no upload UI this pass).
- Bookmarks included.
- No i18n framework — Vietnamese only.

This is a large build; I'll ship it in one pass without stopping for intermediate confirmation.
