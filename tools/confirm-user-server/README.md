Confirm-user server

This small Express server lets an admin confirm user emails using the Supabase service-role key.

Setup
1. Copy `.env.example` to `.env` and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (service role key).
2. Install deps:

   npm install

3. Start server:

   npm start

API
- POST /admin/confirm-user
  Body: { id: '<user-id>' } or { email: '<user-email>' }
  Returns: { ok: true } or error

Security
- Never commit the service-role key to your repo. Keep the server behind authentication or run it locally.
- You can host this as a small internal admin service (e.g., Vercel Serverless, render, or a small VPS).
