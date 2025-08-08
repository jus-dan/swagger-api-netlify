const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};



const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Makerspace API – Person',
      version: '1.0.0',
      description: 'API für Personenverwaltung im Makerspace',
    },
    servers: [
      {
        url: process.env.URL ? `${process.env.URL}/.netlify/functions/person` : 'http://localhost:8888/.netlify/functions/person',
        description: 'API Server',
      }
    ]
  },
  apis: ['./functions/person.js'],
});





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
 *     summary: Liste aller Personen
 *     responses:
 *       200:
 *         description: Gibt eine Liste von Personen zurück
 */

router.get('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { data, error } = await supabase
      .from('person')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Personen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});


/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Einzelne Person anzeigen
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Person
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
      .from('person')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(data);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Person:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});



/**
 * @swagger
 * /:
 *   post:
 *     summary: Neue Person anlegen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - roles
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Person erfolgreich angelegt
 *       400:
 *         description: Fehlerhafte Eingabe
 */


router.post('/', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    let body = req.body;

    // Falls req.body ein Buffer ist → manuell parsen
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString('utf-8'));
    }

    console.log('📥 Request Body:', body);

    if (typeof body !== 'object') {
      return res.status(400).json({ error: 'Ungültiger Anfrageinhalt' });
    }

    const { name, email, roles } = body;

    // Validierung
    if (!name || !email || !Array.isArray(roles)) {
      return res.status(400).json({ error: 'Name, E-Mail und Rollen erforderlich' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' });
    }

    if (roles.length === 0) {
      return res.status(400).json({ error: 'Mindestens eine Rolle erforderlich' });
    }

    const { data, error } = await supabase
      .from('person')
      .insert([{ name: name.trim(), email: email.toLowerCase(), roles }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);

  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Person:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Erstellen der Person' });
  }
});

// Swagger-Doku zuerst am Haupt-Router einhängen
app.use('/.netlify/functions/person/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Person"
}));

// Alternative Swagger-Route ohne .netlify/functions
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Person"
}));

// Dann die eigentliche API einhängen
app.use('/.netlify/functions/person', router);


module.exports.handler = serverless(app);