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
      title: 'Makerspace API – Admin',
      version: '1.0.0',
      description: 'API für Admin-Funktionen und Rollen-Management',
    },
    servers: [
      {
        url: process.env.URL ? `${process.env.URL}/.netlify/functions/admin` : 'http://localhost:8888/.netlify/functions/admin',
        description: 'API Server',
      }
    ]
  },
  apis: ['./functions/admin.js'],
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

// Middleware für Admin-Rolle
const requireAdmin = async (req, res, next) => {
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

    const isAdmin = userRoles.some(ur => ur.roles.name === 'admin');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Fehler bei der Rollen-Überprüfung' });
  }
};

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Alle Rollen mit Berechtigungen abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Rollen mit Berechtigungen
 */
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) return res.status(500).json({ error: error.message });

    // Für jede Rolle die Berechtigungen abrufen
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const { data: permissions, error: permError } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role_id', role.id)
          .order('resource_type');

        if (permError) {
          console.warn(`Warnung: Fehler beim Abrufen der Berechtigungen für Rolle ${role.name}:`, permError);
        }

        return {
          ...role,
          permissions: permissions || []
        };
      })
    );

    res.json(rolesWithPermissions);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Rollen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Neue Rolle erstellen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_system_role:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Rolle erfolgreich erstellt
 */
router.post('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, is_system_role = false } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name und Beschreibung sind erforderlich' });
    }

    // Prüfen ob Rolle bereits existiert
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .single();

    if (existingRole) {
      return res.status(400).json({ error: 'Rolle mit diesem Namen existiert bereits' });
    }

    const { data: role, error } = await supabase
      .from('roles')
      .insert([{
        name: name.trim(),
        description: description.trim(),
        is_system_role
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json(role);
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Rolle:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Rolle bearbeiten
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Rolle erfolgreich aktualisiert
 */
router.put('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const roleId = req.params.id;

    // Prüfen ob es eine System-Rolle ist
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', roleId)
      .single();

    if (checkError || !existingRole) {
      return res.status(404).json({ error: 'Rolle nicht gefunden' });
    }

    if (existingRole.is_system_role) {
      return res.status(400).json({ error: 'System-Rollen können nicht bearbeitet werden' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();

    const { data: role, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', roleId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(role);
  } catch (err) {
    console.error('❌ Fehler beim Bearbeiten der Rolle:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Rolle löschen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rolle erfolgreich gelöscht
 */
router.delete('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roleId = req.params.id;

    // Prüfen ob es eine System-Rolle ist
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', roleId)
      .single();

    if (checkError || !existingRole) {
      return res.status(404).json({ error: 'Rolle nicht gefunden' });
    }

    if (existingRole.is_system_role) {
      return res.status(400).json({ error: 'System-Rollen können nicht gelöscht werden' });
    }

    // Prüfen ob Benutzer diese Rolle haben
    const { data: usersWithRole, error: usersError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role_id', roleId);

    if (usersError) {
      return res.status(500).json({ error: 'Fehler beim Prüfen der Benutzer-Rollen' });
    }

    if (usersWithRole && usersWithRole.length > 0) {
      return res.status(400).json({ 
        error: 'Rolle kann nicht gelöscht werden, da sie noch Benutzern zugewiesen ist' 
      });
    }

    // Rolle löschen (Berechtigungen werden durch CASCADE automatisch gelöscht)
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Rolle erfolgreich gelöscht' });
  } catch (err) {
    console.error('❌ Fehler beim Löschen der Rolle:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Alle Berechtigungen abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Berechtigungen
 */
router.get('/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select(`
        *,
        roles(name)
      `)
      .order('role_id, resource_type');

    if (error) return res.status(500).json({ error: error.message });

    res.json(permissions);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Berechtigungen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /permissions/bulk:
 *   put:
 *     summary: Mehrere Berechtigungen auf einmal aktualisieren
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     roleId:
 *                       type: integer
 *                     resourceType:
 *                       type: string
 *                     permissions:
 *                       type: object
 *     responses:
 *       200:
 *         description: Berechtigungen erfolgreich aktualisiert
 */
router.put('/permissions/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates-Array ist erforderlich' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { roleId, resourceType, permissions } = update;

        if (!roleId || !resourceType || !permissions) {
          errors.push({ update, error: 'Ungültige Update-Daten' });
          continue;
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

        if (error) {
          errors.push({ update, error: error.message });
        } else {
          results.push(data[0]);
        }
      } catch (err) {
        errors.push({ update, error: err.message });
      }
    }

    res.json({
      success: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results
    });

  } catch (err) {
    console.error('❌ Fehler beim Bulk-Update der Berechtigungen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Alle Benutzer mit Rollen abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Benutzer
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        person:person_id(name, email, roles),
        user_roles(
          role_id,
          roles(name, description)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(users);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Benutzer:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /users/{id}/roles:
 *   put:
 *     summary: Benutzer-Rollen zuweisen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Rollen erfolgreich zugewiesen
 */
router.put('/users/:id/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'roleIds muss ein Array sein' });
    }

    // Alle Rollen für diesen Benutzer löschen
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Neue Rollen zuweisen
    if (roleIds.length > 0) {
      const userRoles = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        granted_by: req.user.userId
      }));

      const { data, error } = await supabase
        .from('user_roles')
        .insert(userRoles)
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ message: 'Rollen erfolgreich zugewiesen', userRoles: data });
    } else {
      res.json({ message: 'Alle Rollen entfernt' });
    }

  } catch (err) {
    console.error('❌ Fehler beim Zuweisen der Rollen:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Benutzer bearbeiten
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active:
 *                 type: boolean
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Benutzer erfolgreich aktualisiert
 */
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active, email } = req.body;

    const updateData = {};
    if (is_active !== undefined) updateData.is_active = is_active;

    // E-Mail über person Tabelle aktualisieren
    if (email) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('person_id')
        .eq('id', userId)
        .single();

      if (userError) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      // Prüfen ob E-Mail bereits existiert
      const { data: existingPerson, error: emailCheckError } = await supabase
        .from('person')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', user.person_id)
        .single();

      if (existingPerson) {
        return res.status(400).json({ error: 'E-Mail-Adresse bereits vergeben' });
      }

      // E-Mail in person Tabelle aktualisieren
      const { error: personUpdateError } = await supabase
        .from('person')
        .update({ email: email.toLowerCase() })
        .eq('id', user.person_id);

      if (personUpdateError) {
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der E-Mail' });
      }
    }

    // Benutzer aktualisieren
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        person:person_id(name, email, roles)
      `)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(user);
  } catch (err) {
    console.error('❌ Fehler beim Bearbeiten des Benutzers:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Swagger-Doku
app.use('/.netlify/functions/admin/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Admin"
}));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API - Admin"
}));

app.use('/.netlify/functions/admin', router);

module.exports.handler = serverless(app);
