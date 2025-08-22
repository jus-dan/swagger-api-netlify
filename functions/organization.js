const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const serverless = require('serverless-http');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const router = express.Router();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Fehlende Umgebungsvariablen:', {
    SUPABASE_URL: SUPABASE_URL ? 'gesetzt' : 'fehlt',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'gesetzt' : 'fehlt'
  });
}

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Makerspace Organization API',
      version: '1.0.0',
      description: 'API für Multi-Tenant Makerspace-Verwaltung'
    },
    servers: [
      {
        url: 'http://localhost:8888/.netlify/functions/organization',
        description: 'Local Development'
      },
      {
        url: 'https://your-domain.netlify.app/.netlify/functions/organization',
        description: 'Production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./functions/organization.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Zugriffstoken erforderlich' });
  }

  try {
    // Session in der Datenbank überprüfen
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .single();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Ungültiger Token' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Fehler beim Überprüfen der Berechtigungen' });
    }

    const isAdmin = userRoles.some(ur => ur.roles.name === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Fehler bei der Berechtigungsprüfung' });
  }
};

// ========================================
// ORGANIZATION REGISTRATION (PUBLIC)
// ========================================

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Neuen Makerspace registrieren
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *               - organizationSlug
 *               - adminUsername
 *               - adminPassword
 *               - adminEmail
 *               - adminName
 *             properties:
 *               organizationName:
 *                 type: string
 *                 description: Name des Makerspaces
 *               organizationSlug:
 *                 type: string
 *                 description: Eindeutiger Slug für URLs
 *               adminUsername:
 *                 type: string
 *                 description: Benutzername des Admins
 *               adminPassword:
 *                 type: string
 *                 description: Passwort des Admins
 *               adminEmail:
 *                 type: string
 *                 description: E-Mail des Admins
 *               adminName:
 *                 type: string
 *                 description: Name des Admins
 *               description:
 *                 type: string
 *                 description: Beschreibung des Makerspaces
 *               website:
 *                 type: string
 *                 description: Website des Makerspaces
 *               address:
 *                 type: string
 *                 description: Adresse des Makerspaces
 *     responses:
 *       201:
 *         description: Makerspace erfolgreich registriert
 *       400:
 *         description: Fehlerhafte Eingabe
 *       409:
 *         description: Slug oder E-Mail bereits vergeben
 */
router.post('/register', async (req, res) => {
  try {
    // Überprüfe Umgebungsvariablen
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Fehlende Umgebungsvariablen beim Registrieren');
      return res.status(500).json({ 
        error: 'Server-Konfigurationsfehler - bitte kontaktiere den Administrator' 
      });
    }

    const {
      organizationName,
      organizationSlug,
      adminUsername,
      adminPassword,
      adminEmail,
      adminName,
      description,
      website,
      address
    } = req.body;

    // Validierung
    if (!organizationName || !organizationSlug || !adminUsername || !adminPassword || !adminEmail || !adminName) {
      return res.status(400).json({ error: 'Alle Pflichtfelder sind erforderlich' });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Slug-Validierung (nur Kleinbuchstaben, Zahlen, Bindestriche)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(organizationSlug)) {
      return res.status(400).json({ error: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten' });
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Prüfen ob Organisation bereits existiert
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .single();

    if (existingOrg) {
      return res.status(409).json({ error: 'Organisations-Slug bereits vergeben' });
    }

    // Prüfen ob Admin-E-Mail bereits existiert
    const { data: existingPerson, error: personCheckError } = await supabase
      .from('person')
      .select('id')
      .eq('email', adminEmail.toLowerCase())
      .single();

    if (existingPerson) {
      return res.status(409).json({ error: 'E-Mail-Adresse bereits vergeben' });
    }

    // Prüfen ob Admin-Benutzername bereits existiert
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', adminUsername)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Benutzername bereits vergeben' });
    }

    // Transaktion starten
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: organizationName.trim(),
        slug: organizationSlug.toLowerCase(),
        description: description?.trim(),
        website: website?.trim(),
        address: address?.trim(),
        contact_email: adminEmail.toLowerCase(),
        subscription_plan: 'free'
      }])
      .select()
      .single();

    if (orgError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen der Organisation: ' + orgError.message });
    }

    // Admin-Person erstellen
    const { data: person, error: personError } = await supabase
      .from('person')
      .insert([{
        name: adminName.trim(),
        email: adminEmail.toLowerCase(),
        organization_id: organization.id,
        roles: ['admin']
      }])
      .select()
      .single();

    if (personError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen der Admin-Person: ' + personError.message });
    }

    // Admin-Benutzer erstellen
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        person_id: person.id,
        username: adminUsername.trim(),
        password_hash: passwordHash
      }])
      .select()
      .single();

    if (userError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen des Admin-Benutzers: ' + userError.message });
    }

    // Admin-Rolle zuweisen
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: user.id,
        role_id: 1 // admin role
      }])
      .select()
      .single();

    if (roleError) {
      return res.status(500).json({ error: 'Fehler beim Zuweisen der Admin-Rolle: ' + roleError.message });
    }

    // Organisation-Admin eintragen
    const { error: orgAdminError } = await supabase
      .from('organization_admins')
      .insert([{
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner'
      }]);

    if (orgAdminError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen des Organisations-Admins: ' + orgAdminError.message });
    }

    // Standard-Kategorien für die Organisation erstellen
    const defaultCategories = [
      { name: 'Werkzeuge', description: 'Handwerkzeuge und Elektrowerkzeuge', organization_id: organization.id },
      { name: 'Maschinen', description: 'Große Maschinen und Geräte', organization_id: organization.id },
      { name: 'Material', description: 'Verbrauchsmaterial und Rohstoffe', organization_id: organization.id },
      { name: 'Elektronik', description: 'Elektronische Komponenten und Geräte', organization_id: organization.id }
    ];

    const { error: catError } = await supabase
      .from('resource_category')
      .insert(defaultCategories);

    if (catError) {
      console.warn('Warnung: Fehler beim Erstellen der Standard-Kategorien:', catError);
    }

    res.status(201).json({
      message: 'Makerspace erfolgreich registriert!',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description
      },
      admin: {
        username: adminUsername,
        email: adminEmail
      },
      nextSteps: [
        'Melde dich mit deinen Admin-Daten an',
        'Konfiguriere deine Organisation',
        'Lade weitere Benutzer ein'
      ]
    });

  } catch (err) {
    console.error('❌ Fehler bei der Organisations-Registrierung:', err);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
});

// ========================================
// ORGANIZATION MANAGEMENT (AUTHENTICATED)
// ========================================

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Organisations-Profil abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organisations-Profil erfolgreich abgerufen
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Benutzer-Organisation über person Tabelle finden
    const { data: person, error: personError } = await supabase
      .from('person')
      .select('organization_id')
      .eq('id', req.user.person_id)
      .single();

    if (personError || !person.organization_id) {
      return res.status(404).json({ error: 'Keine Organisation gefunden' });
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', person.organization_id)
      .single();

    if (orgError) {
      return res.status(500).json({ error: 'Fehler beim Abrufen der Organisation' });
    }

    res.json(organization);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen des Organisations-Profils:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Organisations-Profil aktualisieren
 *     security:
 *       - bearerAuth: []
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
 *               website:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               logo_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil erfolgreich aktualisiert
 */
router.put('/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, website, address, phone, logo_url } = req.body;

    // Benutzer-Organisation finden
    const { data: person, error: personError } = await supabase
      .from('person')
      .select('organization_id')
      .eq('id', req.user.person_id)
      .single();

    if (personError || !person.organization_id) {
      return res.status(404).json({ error: 'Keine Organisation gefunden' });
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .update({
        name: name?.trim(),
        description: description?.trim(),
        website: website?.trim(),
        address: address?.trim(),
        phone: phone?.trim(),
        logo_url: logo_url?.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', person.organization_id)
      .select()
      .single();

    if (orgError) {
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der Organisation' });
    }

    res.json({
      message: 'Organisations-Profil erfolgreich aktualisiert',
      organization
    });
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren des Organisations-Profils:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /invite:
 *   post:
 *     summary: Benutzer zur Organisation einladen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, manager, admin]
 *     responses:
 *       200:
 *         description: Einladung erfolgreich gesendet
 */
router.post('/invite', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'E-Mail und Rolle sind erforderlich' });
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Benutzer-Organisation finden
    const { data: person, error: personError } = await supabase
      .from('person')
      .select('organization_id')
      .eq('id', req.user.person_id)
      .single();

    if (personError || !person.organization_id) {
      return res.status(404).json({ error: 'Keine Organisation gefunden' });
    }

    // Prüfen ob E-Mail bereits in der Organisation existiert
    const { data: existingPerson, error: checkError } = await supabase
      .from('person')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('organization_id', person.organization_id)
      .single();

    if (existingPerson) {
      return res.status(409).json({ error: 'E-Mail-Adresse bereits in der Organisation registriert' });
    }

    // Einladung erstellen
    const invitationToken = jwt.sign(
      { email: email.toLowerCase(), organization_id: person.organization_id, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { error: inviteError } = await supabase
      .from('organization_invitations')
      .insert([{
        organization_id: person.organization_id,
        email: email.toLowerCase(),
        invited_by: req.user.id,
        role,
        invitation_token: invitationToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);

    if (inviteError) {
      return res.status(500).json({ error: 'Fehler beim Erstellen der Einladung' });
    }

    // TODO: E-Mail-Einladung senden
    // Für jetzt geben wir den Token zurück (in Produktion würde man eine E-Mail senden)
    res.json({
      message: 'Einladung erfolgreich erstellt',
      invitation: {
        email,
        role,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      note: 'In Produktion wird hier eine E-Mail-Einladung gesendet'
    });

  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Einladung:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ========================================
// PUBLIC ORGANIZATION INFO
// ========================================

/**
 * @swagger
 * /public/{slug}:
 *   get:
 *     summary: Öffentliche Organisations-Informationen abrufen
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organisations-Informationen erfolgreich abgerufen
 */
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('id, name, description, website, address, logo_url, created_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !organization) {
      return res.status(404).json({ error: 'Organisation nicht gefunden' });
    }

    res.json(organization);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der öffentlichen Organisations-Informationen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ========================================
// ADMIN FUNCTIONS (SUPER ADMIN ONLY)
// ========================================

/**
 * @swagger
 * /admin/organizations:
 *   get:
 *     summary: Alle Organisationen abrufen (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organisationen erfolgreich abgerufen
 */
router.get('/admin/organizations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Fehler beim Abrufen der Organisationen' });
    }

    res.json(organizations);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen aller Organisationen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ========================================
// ROUTES SETUP
// ========================================

// Router einhängen
app.use('/.netlify/functions/organization', router);

// Swagger-Dokumentation
app.use('/.netlify/functions/organization/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace Organization API"
}));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace Organization API"
}));

module.exports.handler = serverless(app);
