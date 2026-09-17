# Vercel API implementation plan

This directory documents the server-side routes to add.

## OAuth
`/api/auth/google` creates the Google OAuth URL.  
`/api/auth/callback` exchanges the code and stores the refresh token server-side.

Use Blogger scopes only as needed:
- readonly: `https://www.googleapis.com/auth/blogger.readonly`
- editing: `https://www.googleapis.com/auth/blogger`

## Diagnosis
`/api/diagnosis` should:
- identify the connected blog
- fetch posts/pages through Blogger API
- deduplicate outbound URLs
- use a URL-status cache
- calculate SEO score deterministically
- count broken links deterministically
- produce affected public post/page URLs
- fingerprint normalized findings
- return cached AI output when fingerprint is unchanged
- enforce 5 free / 10 Pro new AI generations per calendar month

AI should receive compact findings, not the entire blog.

## Billing
`/api/billing/create` creates a Flutterwave v4 checkout using:
- USD: $3.99/month
- NGN: ₦4,500/month

`/api/billing/verify` verifies the transaction server-side.

`/api/billing/webhook` handles recurring billing events and keeps subscription state current.

Never unlock Pro solely from a browser success callback.

## FCM
`/api/push` registers/removes web push tokens or subscriptions. A scheduled sync can detect new Blogger posts and trigger FCM notifications.

## Database
Firestore should store small metadata only:
- users
- Blogger connections
- plugin installations/settings
- subscription state
- usage counters
- push subscriptions
- diagnosis fingerprints/summaries
- cache records

Do not duplicate the complete Blogger site into Firestore.


## Blogger editor capabilities

The Blogger v3 API exposes post HTML content and metadata, and supports insert/update/patch/publish/revert/delete for posts. Pages can also be inserted/updated/deleted. It exposes comments, blog metadata/locale and pageview data.

The API reference does **not** list theme/template or layout/layer resources. WyBlog must not pretend to edit those through Blogger API v3. The UI should deep-link users to Blogger for theme/layout editing instead.

The editor should send HTML from WyBlog to the server as Blogger `Post.content`. There is no frontend character limit in WyBlog's editor.

## Editor save

Recommended server endpoints:
- `GET /api/posts/:id`
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `POST /api/posts/:id/publish`
- `POST /api/posts/:id/revert`
- `DELETE /api/posts/:id`

Autosave should debounce network writes while localStorage saves immediately. Use patch/update with the minimum changed fields.

## SEO integrations

Recommended server-side integrations:
- Google Search Console
- Google Analytics
- PageSpeed Insights
- sitemap/robots checks
- canonical/meta/OG/Twitter-card checks
- structured-data/schema checks
- image alt-text checks
- internal-link/orphan-content checks
- broken-link and redirect audits

External API keys/secrets belong server-side.
