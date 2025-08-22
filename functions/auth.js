const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Makerspace API – Authentication',
      version: '1.0.0',
      description: 'API für Benutzer-Authentifizierung und Rollen-Management',
    },
    servers: [
      {
        url: process.env.URL ? `${process.env.URL}/.netlify/functions/auth` : 'http://localhost:8888/.netlify/functions/auth',
        description: 'API Server',
      }
    ]
  },
  apis: ['./functions/auth.js'],
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

// JWT Secret (sollte in .env gesetzt werden)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// Middleware für Rollen-Überprüfung
const requireRole = (requiredRoles) => {
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

      const hasRequiredRole = userRoles.some(ur => 
        requiredRoles.includes(ur.roles.name)
      );

      if (!hasRequiredRole) {
        return res.status(403).json({ error: 'Unzureichende Berechtigungen' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Fehler bei der Rollen-Überprüfung' });
    }
  };
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Benutzer-Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login erfolgreich
 *       401:
 *         description: Ungültige Anmeldedaten
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    // Benutzer in der Datenbank suchen
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        person:person_id(name, email, roles)
      `)
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Passwort überprüfen
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // JWT Token generieren
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email,
        personId: user.person_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Session in der Datenbank speichern
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase
      .from('user_sessions')
      .insert([{
        user_id: user.id,
        session_token: token,
        expires_at: expiresAt.toISOString()
      }]);

    // Last login aktualisieren
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Benutzer-Rollen abrufen
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles(name, description)
      `)
      .eq('user_id', user.id);

    if (rolesError) {
      console.warn('Warnung: Fehler beim Abrufen der Benutzerrollen:', rolesError);
    }

    res.json({
      message: 'Login erfolgreich',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        person: user.person,
        roles: userRoles?.map(ur => ur.roles) || []
      }
    });

  } catch (err) {
    console.error('❌ Fehler beim Login:', err);
    res.status(500).json({ error: 'Serverfehler beim Login' });
  }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Benutzer-Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout erfolgreich
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];

    // Session aus der Datenbank entfernen
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', token);

    res.json({ message: 'Logout erfolgreich' });
  } catch (err) {
    console.error('❌ Fehler beim Logout:', err);
    res.status(500).json({ error: 'Serverfehler beim Logout' });
  }
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Neuen Benutzer registrieren
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert
 *       400:
 *         description: Fehlerhafte Eingabe
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, name } = req.body;

    if (!username || !password || !email || !name) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Prüfen ob Benutzername bereits existiert
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    // Prüfen ob E-Mail bereits in person Tabelle existiert
    const { data: existingPerson, error: personCheckError } = await supabase
      .from('person')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingPerson) {
      return res.status(400).json({ error: 'E-Mail-Adresse bereits vergeben' });
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 12);

    // Person erstellen
    const { data: person, error: personError } = await supabase
      .from('person')
      .insert([{ 
        name: name.trim(), 
        email: email.toLowerCase(), 
        roles: ['user'] 
      }])
      .select()
      .single();

    if (personError) {
      return res.status(400).json({ error: personError.message });
    }

    // Benutzer erstellen
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        person_id: person.id,
        username: username.trim(),
        password_hash: passwordHash
      }])
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // Standard-Rolle 'user' zuweisen
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: user.id,
        role_id: (await supabase.from('roles').select('id').eq('name', 'user').single()).data.id
      }])
      .select()
      .single();

    if (roleError) {
      console.warn('Warnung: Fehler beim Zuweisen der Standard-Rolle:', roleError);
    }

    res.status(201).json({
      message: 'Benutzer erfolgreich registriert',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        person: person
      }
    });

  } catch (err) {
    console.error('❌ Fehler bei der Registrierung:', err);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
});

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Aktuelle Benutzer-Informationen abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzer-Informationen
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        person:person_id(name, email, roles)
      `)
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Benutzer-Rollen abrufen
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles(name, description)
      `)
      .eq('user_id', user.id);

    if (rolesError) {
      console.warn('Warnung: Fehler beim Abrufen der Benutzerrollen:', rolesError);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        person: user.person,
        roles: userRoles?.map(ur => ur.roles) || []
      }
    });

  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Benutzer-Informationen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Alle verfügbaren Rollen abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Rollen
 */
router.get('/roles', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) return res.status(500).json({ error: error.message });
    res.json(roles);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Rollen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Berechtigungen für eine Rolle abrufen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: ID der Rolle
 *     responses:
 *       200:
 *         description: Berechtigungen der Rolle
 */
router.get('/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { roleId } = req.query;

    if (!roleId) {
      return res.status(400).json({ error: 'Rollen-ID erforderlich' });
    }

    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .order('resource_type');

    if (error) return res.status(500).json({ error: error.message });
    res.json(permissions);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Berechtigungen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /permissions:
 *   put:
 *     summary: Berechtigungen für eine Rolle aktualisieren
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - resourceType
 *               - permissions
 *             properties:
 *               roleId:
 *                 type: integer
 *               resourceType:
 *                 type: string
 *               permissions:
 *                 type: object
 *                 properties:
 *                   can_view:
 *                     type: boolean
 *                   can_edit:
 *                     type: boolean
 *                   can_delete:
 *                     type: boolean
 *                   can_create:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Berechtigungen erfolgreich aktualisiert
 */
router.put('/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { roleId, resourceType, permissions } = req.body;

    if (!roleId || !resourceType || !permissions) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .upsert([{
        role_id: roleId,
        resource_type: resourceType,
        permission_type: 'custom',
        ...permissions
      }], {
        onConflict: 'role_id,resource_type,permission_type'
      })
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren der Berechtigungen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Router zuerst einhängen (wichtig für die Reihenfolge!)
app.use('/.netlify/functions/auth', router);

// Swagger-Doku danach
app.use('/.netlify/functions/auth/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Authentication"
}));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Authentication"
}));

module.exports.handler = serverless(app);
