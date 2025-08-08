const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
 *     summary: Liste aller Ressourcen
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter nach Kategorie-ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter nach Status (available, maintenance, out_of_order)
 *     responses:
 *       200:
 *         description: Gibt eine Liste von Ressourcen zurück
 */
router.get('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    let query = supabase
      .from('resource')
      .select(`
        *,
        resource_category (
          id,
          name,
          description,
          icon,
          color
        )
      `)
      .order('created_at', { ascending: false });

    // Filter nach Kategorie
    if (req.query.category) {
      query = query.eq('category_id', req.query.category);
    }

    // Filter nach Status
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Ressourcen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Einzelne Ressource anzeigen
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Ressource
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
      .from('resource')
      .select(`
        *,
        resource_category (
          id,
          name,
          description,
          icon,
          color
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(data);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Ressource:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /:
 *   post:
 *     summary: Neue Ressource anlegen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [available, maintenance, out_of_order]
 *               location:
 *                 type: string
 *               specifications:
 *                 type: object
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ressource erfolgreich angelegt
 *       400:
 *         description: Fehlerhafte Eingabe
 */
router.post('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { name, description, category_id, status, location, specifications, image_url } = req.body;

    // Validierung
    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name und Kategorie sind erforderlich' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' });
    }

    const validStatuses = ['available', 'maintenance', 'out_of_order'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }

    const { data, error } = await supabase
      .from('resource')
      .insert([{
        name: name.trim(),
        description: description?.trim(),
        category_id,
        status: status || 'available',
        location: location?.trim(),
        specifications,
        image_url
      }])
      .select(`
        *,
        resource_category (
          id,
          name,
          description,
          icon,
          color
        )
      `);

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Ressource:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Erstellen der Ressource' });
  }
});

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Ressource bearbeiten
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Ressource
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
 *               category_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [available, maintenance, out_of_order]
 *               location:
 *                 type: string
 *               specifications:
 *                 type: object
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ressource erfolgreich aktualisiert
 *       404:
 *         description: Nicht gefunden
 */
router.put('/:id', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { name, description, category_id, status, location, specifications, image_url } = req.body;

    // Validierung
    if (name && name.trim().length < 2) {
      return res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' });
    }

    const validStatuses = ['available', 'maintenance', 'out_of_order'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (category_id) updateData.category_id = category_id;
    if (status) updateData.status = status;
    if (location !== undefined) updateData.location = location?.trim();
    if (specifications !== undefined) updateData.specifications = specifications;
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data, error } = await supabase
      .from('resource')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        resource_category (
          id,
          name,
          description,
          icon,
          color
        )
      `);

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren der Ressource:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren der Ressource' });
  }
});

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Ressource löschen
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Ressource
 *     responses:
 *       200:
 *         description: Ressource erfolgreich gelöscht
 *       404:
 *         description: Nicht gefunden
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { error } = await supabase
      .from('resource')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json({ message: 'Ressource erfolgreich gelöscht' });
  } catch (err) {
    console.error('❌ Fehler beim Löschen der Ressource:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Löschen der Ressource' });
  }
});

// Swagger-Dokumentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Makerspace API – Ressourcen',
      version: '1.0.0',
      description: 'API für Ressourcenverwaltung im Makerspace',
    },
    servers: [
      {
        url: process.env.URL ? `${process.env.URL}/.netlify/functions/resource` : 'http://localhost:8888/.netlify/functions/resource',
        description: 'API Server',
      }
    ]
  },
  apis: ['./functions/resource.js'],
});

app.use('/.netlify/functions/resource/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Ressourcen"
}));

app.use('/.netlify/functions/resource', router);

module.exports.handler = serverless(app);
