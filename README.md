# Wholesale Deal Finder App

A Zillow-style nationwide wholesaling analyzer with:
- Search filters: location, price range, beds, baths
- Deal analyzer: ARV, estimated repairs, MAO, offer range, contract value
- Assignment fee controls with quick presets
- Motivated seller scoring (`want-to-sell` vs `need-to-sell`)
- AI tool panels (marketing, offers, scripts, comps, pipeline)
- Single-photo and batch-photo rehab grading
- Auto ARV from listing photos (no manual ARV input required)
- Conservative/Estimated/Aggressive ARV ranges from photos
- Deal pipeline tracking with stage management
- Deal comparison and JSON/CSV export
- Green/yellow/red flip decision badge on selected house
- Contact hub with owner/agent phone/email
- AI outreach preview + confirm-send flow (SMS/email/voice)
- User auth (register/login/logout) with persistent sessions
- Email verification + password reset token workflows
- Role-based admin console (users + platform audit logs)
- CSRF protection, security headers, login lockout, request rate limiting
- Stripe subscription flow (7-day trial then $20/month)
- CRM leads + tasks workflow (stage management + follow-up queue)
- Sentry-ready browser monitoring + structured server request/error logs
- Cloud saved searches and cloud saved deals (per account)
- Outreach consent + audit log events for compliance tracking
- Pagination with Load More Houses (30 per page default)
- Map circle area filter for targeted neighborhood searches
- Custom polygon draw-map search (draw your target area)
- Source-true photos only (no random/generated photo mixing per listing)
- Source health history dashboard + live search cache/retry layer

## Run

```bash
npm start
```

Open: [http://localhost:3000](http://localhost:3000)

If `npm` is not on your PATH in this folder, run:

```bash
.\node.exe server.js
```

Validation:

```bash
npm run check
npm test
```

Production readiness:

```bash
npm run readiness
```

## Notes

- This starter version uses local sample property data in `data/sample-listings.json`.
- Sample mode now defaults to exact sample listings only (no synthetic expansion) so photos stay tied to each specific listing.
- Live Zillow mode is already wired via RapidAPI (`propertyExtendedSearch`) in `server.js`.
- The deal analysis is a quick underwriting model and should be validated with comps, title review, contractor bids, and local market data.
- Use objective criteria only and follow Fair Housing / anti-discrimination rules.

## Live Zillow Setup

1. Copy `.env.example` to `.env`.
2. Set `ZILLOW_MODE=rapidapi`.
3. Add your `ZILLOW_RAPIDAPI_KEY`.
4. Restart the server.

If live fetch fails or credentials are missing, the app auto-falls back to local sample data and shows that in the UI data-source status line.

Optional:
- Set `SAMPLE_VARIANT_COUNT` greater than `1` only if you intentionally want synthetic sample duplicates for testing pagination.

## AI Photo Rehab Grader Setup

1. Add `OPENAI_API_KEY` to `.env`.
2. Optional: set `OPENAI_MODEL` (default is `gpt-4.1-mini`).
3. In the app, select a property, choose a photo, and click **Run AI Photo Grade** (single photo) or **Run Batch Photo Grade** (all photos).

If `OPENAI_API_KEY` is missing or the AI request fails, the server returns a local heuristic estimate so the workflow still works.

## Auto ARV From Photos

- When you select a house, the app calls `/api/arv-from-photos` automatically.
- ARV is estimated from photo-based rehab signals and listing price.
- The ARV panel shows Conservative / Estimated / Aggressive ARV, plus source + confidence + rationale.

## AI Tool Generation

- AI cards now call `/api/tool-run` and generate output for:
  - Marketing Flyer
  - Offer Message Generator
  - Cold Calling Scripts
  - Buyer Message Generator
- Output appears in the **AI Tool Output** panel.
- If OpenAI is unavailable, the app uses built-in high-quality templates.

## Contact Outreach Automation

- Select a house and open **AI Contact & Outreach**.
- View owner/agent phone/email.
- Click SMS, email, or AI voice call action.
- App generates an AI draft/script and asks for confirmation.
- Press **Yes, Send** to execute.

By default, delivery is simulated for safety (`ENABLE_REAL_OUTREACH=false`).
To send real outreach:

1. Set `ENABLE_REAL_OUTREACH=true`
2. Configure Twilio for SMS/voice:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`
3. Configure SendGrid for email:
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`

## Auth + Admin Setup

- Add optional admin emails in `.env`:
  - `ADMIN_EMAILS=you@example.com,partner@example.com`
- Optional token expirations:
  - `PASSWORD_RESET_TTL_MS=1800000`
  - `EMAIL_VERIFY_TTL_MS=86400000`

App now includes:
- Request/complete password reset flow
- Request/complete email verification flow
- Admin-only panel to review users and audit logs
- Admin security stats + one-click DB backup export (`data/backups`)

## Billing Setup (7-Day Trial -> $20/Month)

1. Add Stripe values in `.env`:
   - `APP_BASE_URL=http://localhost:3000`
   - `STRIPE_SECRET_KEY=...`
   - `STRIPE_WEBHOOK_SECRET=...`
   - Optional pre-created price: `STRIPE_PRICE_MONTHLY_20=price_...`
2. If `STRIPE_PRICE_MONTHLY_20` is blank, the app creates inline price-data for `$20/month`.
3. Use UI buttons:
   - **Start 7-Day Trial ($20/mo after)**
   - **Manage Billing**
4. Configure Stripe webhook to:
   - `POST /api/stripe/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

## CRM Workflow

- **Create Lead From Selected House** adds a CRM lead from selected listing.
- Auto-creates first follow-up task.
- Advance stage quickly from lead cards:
  - `new -> contacted -> underwriting -> offer_sent -> negotiation -> contracted -> dispo -> closed`
- Task board supports complete/undo/delete.

## Publish Hardening

- Health endpoints:
  - `GET /api/livez`
  - `GET /api/readyz`
- Security middleware:
  - CSRF token endpoint: `GET /api/auth/csrf`
  - Strict security headers + CSP
  - Request rate limits + login lockout
  - Optional secure cookies in production: `COOKIE_SECURE=true` (when served over HTTPS)
- Backup:
  - Admin button creates JSON backup in `data/backups/`
  - Admin restore latest backup workflow for disaster recovery drills
- Stripe live wiring test:
  - Admin button uses `/api/admin/stripe-live-check`
- Logs:
  - Request log: `data/logs/app.log`
  - Error log: `data/logs/error.log`

## Legal/Compliance UI

- Terms page: `/terms.html`
- Privacy page: `/privacy.html`
- Outreach consent logs panel:
  - `GET /api/user/outreach-consent-logs`
  - Shows preview/send outreach audit events

## Deal Pipeline + Export

- Click **Save Deal to Pipeline** to store selected deals locally.
- Move stages: `lead -> underwrite -> offer -> contracted -> dispo`.
- Compare selected deal to your top pipeline deal in the **Deal Comparison & Export** panel.
- Export selected underwriting to `.json` or `.csv`.

## Core Formulas Used

- `MAO (buyer max) = ARV * 0.70 - repairs - closing costs - holding costs`
- `Contract Value = MAO - Assignment Fee`
- `Offer Range ~= Contract Value - $7,000 to Contract Value`
- `Annualized Return Proxy ~= (flip profit / total cost) * 2`

## Files

- `server.js` - static server + `/api/search`, `/api/photo-grade`, `/api/photo-grade-batch`, `/api/tool-run`
- `public/index.html` - app layout
- `public/styles.css` - visual style
- `public/app.js` - logic + calculators + scoring
- `data/sample-listings.json` - seed listings
