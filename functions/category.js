const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const router = express.Router();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());
router.use(bodyParser.json());

// Supabase-Verbindung
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Check if Supabase is configured
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('⚠️  Supabase environment variables are not configured!');
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Liste aller Kategorien
 *     responses:
 *       200:
 *         description: Gibt eine Liste von Kategorien zurück
 */
router.get('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { data, error } = await supabase
      .from('resource_category')
      .select('*')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Kategorien:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Einzelne Kategorie anzeigen
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Kategorie
 *     responses:
 *       200:
 *         description: Erfolgreich
 *       404:
 *         description: Nicht gefunden
 */
router.get('/:id', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { data, error } = await supabase
      .from('resource_category')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(data);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Kategorie:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /:
 *   post:
 *     summary: Neue Kategorie anlegen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kategorie erfolgreich angelegt
 *       400:
 *         description: Fehlerhafte Eingabe
 */
router.post('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { name, description, icon, color } = req.body;

    // Validierung
    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' });
    }

    const { data, error } = await supabase
      .from('resource_category')
      .insert([{
        name: name.trim(),
        description: description?.trim(),
        icon: icon?.trim(),
        color: color?.trim()
      }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Kategorie:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Erstellen der Kategorie' });
  }
});

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Kategorie bearbeiten
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Kategorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich aktualisiert
 *       404:
 *         description: Nicht gefunden
 */
router.put('/:id', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { name, description, icon, color } = req.body;

    // Validierung
    if (name && name.trim().length < 2) {
      return res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (icon !== undefined) updateData.icon = icon?.trim();
    if (color !== undefined) updateData.color = color?.trim();

    const { data, error } = await supabase
      .from('resource_category')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren der Kategorie:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren der Kategorie' });
  }
});

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Kategorie löschen
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Kategorie
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich gelöscht
 *       404:
 *         description: Nicht gefunden
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { error } = await supabase
      .from('resource_category')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json({ message: 'Kategorie erfolgreich gelöscht' });
  } catch (err) {
    console.error('❌ Fehler beim Löschen der Kategorie:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Löschen der Kategorie' });
  }
});

app.use('/.netlify/functions/category', router);

module.exports.handler = serverless(app);
