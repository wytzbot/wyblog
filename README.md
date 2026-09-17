# WyBlog

WyBlog is a mobile-first control panel and plugin ecosystem for Blogger.

## Current foundation

- React + Vite + TypeScript
- Mobile-first dashboard
- Blogger connection flow placeholder
- Site-wide AI Diagnosis UI
- SEO score + broken-link metrics
- Plugin catalog foundation
- Free/Pro usage model
- Pro pricing: **$3.99/month / ₦4,500/month**
- Flutterwave v4 integration boundary
- Firebase/FCM configuration boundary
- Server-only OAuth/payment/AI secrets
- Cache-first diagnosis architecture
- Collapsible menu with Blogger and legal links

## Important

The initial ZIP intentionally does **not** fake Google OAuth, Blogger API access, Flutterwave verification, or AI responses. Those require server-side credentials and API routes.

### Run locally

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

## Planned server routes

- `/api/auth/google`
- `/api/auth/callback`
- `/api/blogs`
- `/api/posts`
- `/api/diagnosis`
- `/api/plugins`
- `/api/push`
- `/api/billing/create`
- `/api/billing/verify`
- `/api/billing/webhook`

## Diagnosis architecture

1. Fetch authoritative Blogger content through the server.
2. Normalize site findings.
3. Deduplicate external URLs.
4. Check/cache URL status.
5. Calculate deterministic SEO score and broken-link count.
6. Hash normalized findings.
7. Return cached AI interpretation when the hash is unchanged.
8. Only consume a diagnosis credit when a new AI generation is required.

Free: 5 new AI generations/month.  
Pro: 10 new AI generations/month.

Blogger remains the publishing backend. WyBlog should not unnecessarily duplicate a user's entire blog database.

## Security

Never put Google client secrets, OAuth refresh tokens, Flutterwave secret keys, AI provider keys, Firebase Admin private keys, or session secrets in frontend code.


## Fixed in this build

- Firebase no longer initializes with missing/empty configuration.
- FCM service worker safely no-ops until real public Firebase config is supplied.
- Production service-worker registration is non-blocking.
- Demo data is explicitly labeled as preview data.
- Placeholder affected-content rows no longer pretend to be real broken pages.
- Diagnosis quota cannot go below zero.
- Connect/checkout/diagnosis placeholder actions give explicit status instead of pretending success.
- Keyboard focus and disabled states are handled.
- Mobile layout has additional narrow-screen safeguards.
- Removed the fake production sitemap URL.

## Still requires credentials/server implementation

The frontend cannot safely invent or emulate:
- Google OAuth
- Blogger API
- Firestore server access
- Firebase Admin/FCM server sending
- Flutterwave v4 verification/webhooks
- AI provider calls

Those should be implemented under `/api` with server-only secrets.


## Expanded editor

The editor now includes:
- unlimited body character capacity (no frontend maxlength)
- visual + HTML source modes
- bold, italic, undo, redo
- font selection
- H1-H6/body blocks
- left/center/right alignment
- text color + highlight color
- links
- Google search
- copy selected text
- image/video insertion
- asterisk insertion
- clear formatting
- article-file import for TXT/Markdown/HTML
- title extraction from the first imported line
- SEO metadata, labels and feature-image fields
- recommended 1200×675 feature-image ratio
- local immediate autosave
- local JSON backup download
- live preview
- custom non-browser delete confirmation
- scroll-aware floating toolbar
- selection-preserving formatting so formatting applies to the selected text

For security, HTML preview should be sanitized on the server before displaying user-authored HTML in a production multi-user environment.


## Editor import behavior

Supported client-side article imports are TXT, Markdown, and HTML. The importer strips formatting to text, uses the first non-empty line as the article title/SEO title, puts remaining text into the article body, and creates an initial meta description from the body. Unsupported formats are rejected rather than pretending to parse them.

A server-side document parser can be added later for DOCX/PDF without changing the editor contract.

## Cloud storage architecture
WyBlog keeps small user metadata, draft state, settings and FCM registration tokens in Firestore. Large files/backups should go to Google Drive rather than Firestore. Blogger remains the source of truth for published posts/pages/comments. The editor keeps an immediate local autosave and also performs best-effort Firestore draft sync.

Firestore rules are included in `firestore.rules`. Enable Firebase Authentication -> Anonymous sign-in and Firestore in the `wyblog1` Firebase project before deploying.
