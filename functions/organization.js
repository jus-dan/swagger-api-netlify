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
    console.log('🔄 POST /register empfangen');
    console.log('📋 Request Body:', req.body);
    console.log('📋 Request Headers:', req.headers);
    
    // Einfache Validierung
    const { organizationName, organizationSlug, adminEmail, adminName } = req.body;
    
    console.log('🔍 Extrahierte Daten:', {
      organizationName,
      organizationSlug,
      adminEmail,
      adminName
    });

    if (!organizationName || !organizationSlug || !adminEmail || !adminName) {
      console.log('❌ Validierung fehlgeschlagen - fehlende Felder');
      console.log('❌ organizationName:', !!organizationName);
      console.log('❌ organizationSlug:', !!organizationSlug);
      console.log('❌ adminEmail:', !!adminEmail);
      console.log('❌ adminName:', !!adminName);
      return res.status(400).json({ 
        error: 'Alle Pflichtfelder sind erforderlich',
        received: {
          organizationName: !!organizationName,
          organizationSlug: !!organizationSlug,
          adminEmail: !!adminEmail,
          adminName: !!adminName
        }
      });
    }

    console.log('✅ Alle Validierungen bestanden');
    
    // Erfolgreiche Antwort (ohne Datenbank)
    const response = {
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
    };
    
    console.log('📤 Sende erfolgreiche Antwort:', response);
    res.status(201).json(response);

  } catch (err) {
    console.error('❌ Fehler bei der Organisations-Registrierung:', err);
    console.error('❌ Error Stack:', err.stack);
    res.status(500).json({ 
      error: 'Serverfehler bei der Registrierung',
      details: err.message
    });
  }
});

// ========================================
// ROUTES SETUP
// ========================================

// Router einhängen
app.use('/.netlify/functions/organization', router);

module.exports.handler = serverless(app);
