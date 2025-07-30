const express = require('express');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');



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
        url: 'https://radiant-maamoul-fab9c6.netlify.app/.netlify/functions/person',
        description: 'Live API auf Netlify',
      }
    ]
  },
  apis: ['./functions/person.js'],
});





const app = express();
const router = express.Router();

app.use(express.json());

// Supabase-Verbindung (ersetze durch deine Werte!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);



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
  const { data, error } = await supabase
    .from('person')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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
  const { data, error } = await supabase
    .from('person')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(data);
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
  
  console.log('📥 typeof req.body:', typeof req.body);
  console.log('📥 Request Body:', req.body); // Wird im Netlify-Log angezeigt

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

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Swagger-Doku zuerst am Haupt-Router einhängen
app.use('/.netlify/functions/person/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Dann die eigentliche API einhängen
app.use('/.netlify/functions/person', router);


module.exports.handler = serverless(app);