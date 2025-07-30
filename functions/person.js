const express = require('express');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const app = express();
const router = express.Router();
app.use(express.json());

// Supabase-Verbindung (ersetze durch deine Werte!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
// 🔍 GET /person – alle Personen anzeigen
router.get('/person', async (req, res) => {
  const { data, error } = await supabase
    .from('person')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔍 GET /person/:id – einzelne Person abrufen
router.get('/person/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('person')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(data);
});

// 🆕 POST /person – neue Person anlegen
router.post('/person', async (req, res) => {
  const { name, email, roles } = req.body;

  if (!name || !email || !Array.isArray(roles)) {
    return res.status(400).json({ error: 'Name, E-Mail und Rollen erforderlich' });
  }

  const { data, error } = await supabase
    .from('person')
    .insert([{ name, email, roles }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.use('/.netlify/functions/person', router);
module.exports.handler = serverless(app);
