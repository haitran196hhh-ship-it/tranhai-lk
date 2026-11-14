# AKIRRAI management release

Render: branch main; build npm ci; start npm start; health /health.
Environment: use RENDER_ENV.example; set AKIRRAI_PUBLIC_URL=https://tranhai-lk.onrender.com.
The app uses the existing Supabase platform_kv_store, users, ai_jobs, and credit_ledger tables; no new SQL migration is needed for CMS/device management.

## Daily operation
- /akirrai: log in, create an image, create/check a payment order.
- /akirrai-manage: CMS draft, asset upload, publish, rollback, member approval/suspension, job/credit history, private device module download/revocation.
- Create Supabase Auth accounts in Supabase Authentication, verify their email. The confirmed owner email AKIRRAI_ADMIN_EMAIL gets the owner role on first login. Other accounts create a pending app record on first login; approve it in management.
- CMS editor uses JSON for the catalog, with buttons to add an item and attach a PNG/JPEG/WebP. AI: id/type/name/prompt; caption: value; color: color; Photobooth: layout width/height 1080, 2-4 rectangular slots. Disabled items use enabled:false. Save a draft before publishing. CMS payload limit is 10 MB.
- Publication versions retain assets as base64 in Supabase and rematerialize image files after a Render restart. Backend instances refresh the live pointer at most every 5 seconds. Rollback changes live publication, leaving the draft unchanged.
- Generate a PRIVATE Surge module from management. It contains a 30-day device key. Replace prior AI/Photobooth forwarding rules so exactly one forwarder handles generateFilteredImage. Do not publish the personal module on GitHub. Revocation is effective on the next backend request. New effects can be selected by id on the web client; this release does not inject new filter menus into Locket's proprietary UI.
- Device keys can process images only; they cannot access management, account history, payments, or issue additional keys. The device forwarder sends no original Locket authorization header to the backend.
- SePay webhook: https://tranhai-lk.onrender.com/api/akirrai/sepay/webhook ; JSON, HMAC-SHA256, incoming funds, MB 0917921802. Configure the same secret in SePay and Render. Enable AKIRRAI_SECURE_PAYMENTS=1 only after configuring real credentials and validating the receiving account. Prices are server configured in AKIRRAI_PACKAGES_JSON.

## Verification limits
Automated local checks cover CMS validation, publication ordering, rollback validation, device scope rejection, and HTTP routing. No real AI purchase, bank transfer or on-device Surge execution is performed by the updater. Supabase Auth accounts and provider keys remain your Render/Supabase configuration.
Worker deployment to Cloudflare remains separate from Render; the authenticated module forwards to Render directly. A Render deploy does not deploy worker.js to Cloudflare.
