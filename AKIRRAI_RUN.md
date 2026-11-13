# AKIRRAI web auth update
Render branch: main
Build: npm ci
Start: npm start
Health: /health
Web: /akirrai

Copy RENDER_ENV.example values into Render and replace placeholders there.
Create the owner in Supabase Authentication with the configured email and confirm that email.
On first successful login the verified owner is provisioned as SUPER_ADMIN.
SePay webhook: https://YOUR_RENDER_HOST/api/akirrai/sepay/webhook
Authentication: HMAC-SHA256; JSON payload. Configure matching secret on both sides.
Keep payments disabled until real authentication, quota and webhook checks succeed.

Implemented: existing image/Photobooth pipeline, Admin web login, atomic AI reservations/refunds,
SePay orders and idempotent database crediting, read-only users/orders/catalog views.
Not completed: CMS editing/publish/rollback UI, public user onboarding/approval,
and authentication in the older intercepted Locket module. Use the new web client for authenticated AI.
No production end-to-end verification has been performed. No paid provider calls were made in tests.
