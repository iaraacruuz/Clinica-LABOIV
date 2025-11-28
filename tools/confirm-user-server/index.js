require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 4000;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ ok: true, info: 'Confirm-user server' }));

// POST /admin/confirm-user { id: '<user_id>' }
app.post('/admin/confirm-user', async (req, res) => {
  const { id, email } = req.body || {};
  if (!id && !email) return res.status(400).send({ error: 'id or email required' });

  try {
    let targetId = id;
    if (!targetId && email) {
      // try to find user by email
      const list = await supabase.auth.admin.listUsers();
      const found = (list?.data || []).find(u => u.email === email);
      if (!found) return res.status(404).send({ error: 'user-not-found' });
      targetId = found.id;
    }

    // Update the auth.users row to set email_confirmed_at = now()
    // Using admin.updateUserById if available
    if (!targetId) return res.status(400).send({ error: 'user id not found' });

    // supabase-js v2 exposes auth.admin.updateUserById
    if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.updateUserById === 'function') {
      const payload = { email_confirmed_at: new Date().toISOString() };
      const { data, error } = await supabase.auth.admin.updateUserById(targetId, payload);
      if (error) return res.status(500).send({ error: 'update-failed', detail: error });
      return res.send({ ok: true, data });
    }

    // Fallback: try raw SQL via PostgREST is not allowed for auth schema; return informative error
    return res.status(500).send({ error: 'admin-api-method-not-available' });
  } catch (e) {
    console.error('confirm-user error', e);
    return res.status(500).send({ error: 'unexpected', detail: e.message || e });
  }
});

app.listen(PORT, () => console.log('Confirm-user server listening on', PORT));
