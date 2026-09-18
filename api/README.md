# WyBlog server integration notes

## Pro billing
WyBlog Pro is **$1/month or ₦1,000/month**. All Pro plugins unlock together after the server confirms an active subscription.

Create one monthly Flutterwave Payment Plan for each currency and set:
- `FLW_PAYMENT_PLAN_USD` — USD plan ID charging $1 monthly
- `FLW_PAYMENT_PLAN_NGN` — NGN plan ID charging ₦1,000 monthly
- `FLW_SECRET_KEY`
- `FLW_WEBHOOK_SECRET_HASH`
- `APP_URL` — the production WyBlog URL

The checkout is created server-side. Flutterwave redirects the user back to WyBlog, but the browser callback alone never grants Pro. The verification route checks the transaction server-side; the webhook also verifies the transaction and is idempotent before updating Firestore.

Flutterwave documents payment plans as recurring subscriptions and recommends webhooks plus server-side verification before granting value. urlFlutterwave Payment Planshttps://developer.flutterwave.com/docs/payment-plans-1

## Firebase / notifications
Set these server variables:
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `WYBLOG_PUSH_SECRET`

The browser uses the public Firebase web configuration and VAPID key. The Firebase Admin private key is server-only.

The service worker must remain at `/firebase-messaging-sw.js` on the HTTPS origin. WyBlog refuses notification registration when the page is not secure, when service-worker registration fails, or when FCM token creation fails. FCM requires HTTPS and a messaging service worker for web push. urlFirebase Web FCM setuphttps://firebase.google.com/docs/cloud-messaging/web/get-started

Server delivery routes:
- `POST /api/push` — send to one token; requires `Authorization: Bearer $WYBLOG_PUSH_SECRET`.
- `POST /api/push/broadcast` — send to registered tokens; same secret.

A broadcast response reports `sent` and `failed`; the server never claims delivery when Firebase rejects the request.

## Plugin delivery model
Plugins are delivered in-app as copyable snippets and integration instructions. No plugin ZIP is required. Each plugin detail screen tells the user exactly where the snippet belongs and warns when server-side configuration is required.

Never paste Firebase Admin keys, Flutterwave secret keys, Google OAuth client secrets, or AI provider keys into Blogger theme code.
