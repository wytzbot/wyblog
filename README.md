# WyBlog

WyBlog is a Blogger-first publishing, SEO and site-management dashboard. Blogger remains the source of truth.

## Implemented production flows

- Google OAuth with CSRF state validation and Blogger/Search Console/Analytics read scopes.
- Secure HTTP-only encrypted session cookie; refresh tokens are never exposed to client JavaScript.
- Blogger blog discovery and server-side ownership checks.
- Posts: list, pagination, create draft, update draft, delete, diagnose and explicit publish.
- Publishing is gated behind the diagnosis route and server-side confirmation.
- Deterministic SEO scoring and site audit with title, metadata, headings, readability, links, images, duplicate-title and social/schema checks.
- Rate-limited broken-link scanning with SSRF/private-network protections.
- Blogger Pages create/edit/delete.
- Blogger comment moderation: approve, spam and delete.
- Media inspection from existing Blogger HTML; no permanent media storage.
- Blogger PageViews analytics (7 days, 30 days, all time).
- Google Search Console property listing and query performance when the signed-in account has access.
- Site-health checks for public DNS, HTTPS, robots and sitemap.
- Blogger custom-domain DNS diagnostics using Google's current documented records.
- Downloadable `.wybak` backup with paginated posts/pages and explicit restore-support metadata.
- Safety backup before restore; restore creates drafts rather than silently overwriting published content.
- Bulk PRO operations for title, meta description, labels and confirmed deletion.
- Secure WyDev entitlement/checkout abstraction for PRO.
- Account-scoped WyBlog SEO/social settings.
- PWA manifest, icons and service-worker registration.

## Deliberate API limitations

Blogger API v3 does not expose template XML management. WyBlog therefore does not provide fake upload/restore buttons for templates; the Template page links to Blogger instead.

Some Blogger settings are also not writable through the API. WyBlog stores its own SEO/social defaults separately and identifies Blogger-controlled settings rather than pretending to change them.

Scheduled audits/backups require a durable server-side job store (database) because browser cookies cannot safely act as a cron queue. The core publishing product does not depend on this.

## Server environment

Required:

- `APP_URL`
- `NEXTAUTH_SECRET` (32+ random characters)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Payment/entitlement:

- `WYDEV_ENTITLEMENT_URL`
- `WYDEV_CHECKOUT_URL`
- `WYDEV_ENTITLEMENT_SECRET`
- `PLAN_PRO_NGN` (default 2000)
- `PLAN_AGENCY_NGN` (default 5000)

Never use `NEXT_PUBLIC_` for secrets.

## Google Cloud

Enable Blogger API v3. If Search Console/analytics features are used, keep the OAuth scopes requested by the app and configure the OAuth consent screen appropriately.

Production callback:

`https://YOUR-DOMAIN/api/auth/callback`

## WyDev contract

WyBlog intentionally does not duplicate Flutterwave webhooks. The configured WyDev entitlement endpoint must return a plan/status object such as:

```json
{"plan":"PRO","status":"active"}
```

The checkout endpoint must return:

```json
{"checkoutUrl":"https://..."}
```

No Flutterwave secret belongs in this repository.

## Development

```bash
npm install
npm run build
npm run start
```

The preparation environment could not download npm dependencies, so a complete Next.js production build could not be executed inside this container. Source syntax was checked with the installed TypeScript compiler and no parser-level errors were reported.

## License

WyBlog is released under the MIT License. See `LICENSE`.
