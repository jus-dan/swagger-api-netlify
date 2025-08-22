const express = require('express');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());

// ========================================
// ORGANIZATION REGISTRATION (PUBLIC)
// ========================================

router.post('/register', async (req, res) => {
  try {
    // Einfache Validierung
    const { organizationName, organizationSlug, adminEmail, adminName } = req.body;

    if (!organizationName || !organizationSlug || !adminEmail || !adminName) {
      return res.status(400).json({ error: 'Alle Pflichtfelder sind erforderlich' });
    }

    // Erfolgreiche Antwort (ohne Datenbank)
    res.status(201).json({
      message: 'Makerspace erfolgreich registriert!',
      organization: {
        name: organizationName,
        slug: organizationSlug
      },
      admin: {
        email: adminEmail,
        name: adminName
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
// ROUTES SETUP
// ========================================

// Router einhängen
app.use('/.netlify/functions/organization', router);

module.exports.handler = serverless(app);
