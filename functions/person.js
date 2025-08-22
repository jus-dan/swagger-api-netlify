const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Check if Supabase is configured
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('⚠️  Supabase environment variables are not configured!');
}

// Middleware für JWT-Verifizierung
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Zugriffstoken erforderlich' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Session in der Datenbank überprüfen
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('user_id', decoded.userId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({ error: 'Ungültige oder abgelaufene Session' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Ungültiger Token' });
  }
};

// Middleware für Berechtigungs-Überprüfung
const checkPermission = (resourceType, permission) => {
  return async (req, res, next) => {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles(name)
        `)
        .eq('user_id', req.user.userId);

      if (error) {
        return res.status(500).json({ error: 'Fehler beim Abrufen der Benutzerrollen' });
      }

      // Berechtigungen für alle Rollen des Benutzers abrufen
      const roleIds = userRoles.map(ur => ur.role_id);
      const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select('*')
        .in('role_id', roleIds)
        .eq('resource_type', resourceType);

      if (permError) {
        return res.status(500).json({ error: 'Fehler beim Abrufen der Berechtigungen' });
      }

      // Prüfen ob der Benutzer die erforderliche Berechtigung hat
      const hasPermission = permissions.some(perm => perm[permission] === true);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Unzureichende Berechtigungen' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Fehler bei der Berechtigungs-Überprüfung' });
    }
  };
};



/**
 * @swagger
 * /:
 *   get:
 *     summary: Liste aller Personen
 *     responses:
 *       200:
 *         description: Gibt eine Liste von Personen zurück
 */

router.get('/', authenticateToken, checkPermission('person', 'can_view'), async (req, res) => {
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

router.get('/:id', authenticateToken, checkPermission('person', 'can_view'), async (req, res) => {
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


router.post('/', authenticateToken, checkPermission('person', 'can_create'), async (req, res) => {
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

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Person bearbeiten
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Person
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Person erfolgreich aktualisiert
 *       404:
 *         description: Nicht gefunden
 */
router.put('/:id', authenticateToken, checkPermission('person', 'can_edit'), async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { name, email, roles, active } = req.body;

    // Validierung
    if (name && name.trim().length < 2) {
      return res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    if (roles && !Array.isArray(roles)) {
      return res.status(400).json({ error: 'Rollen müssen ein Array sein' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (roles) updateData.roles = roles;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('person')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren der Person:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren der Person' });
  }
});

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Person löschen
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Die ID der Person
 *     responses:
 *       200:
 *         description: Person erfolgreich gelöscht
 *       404:
 *         description: Nicht gefunden
 */
router.delete('/:id', authenticateToken, checkPermission('person', 'can_delete'), async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase nicht konfiguriert' });
    }

    const { error } = await supabase
      .from('person')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json({ message: 'Person erfolgreich gelöscht' });
  } catch (err) {
    console.error('❌ Fehler beim Löschen der Person:', err.message);
    res.status(500).json({ error: 'Serverfehler beim Löschen der Person' });
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