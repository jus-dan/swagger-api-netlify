const express = require('express');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS für lokale Entwicklung
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ========================================
// TEST ROUTE
// ========================================

router.get('/test', (req, res) => {
  console.log('🧪 GET /test aufgerufen');
  res.json({ 
    message: 'Organization API läuft!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// ========================================
// ORGANIZATION REGISTRATION (PUBLIC)
// ========================================

router.post('/register', async (req, res) => {
  try {
    console.log('🔄 POST /register empfangen');
    console.log('📋 Request Method:', req.method);
    console.log('📋 Request URL:', req.url);
    console.log('📋 Request Body:', req.body);
    console.log('📋 Request Headers:', req.headers);
    console.log('📋 Content-Type:', req.get('Content-Type'));
    
    // Prüfe ob Body existiert
    if (!req.body) {
      console.log('❌ Kein Request Body gefunden');
      return res.status(400).json({ 
        error: 'Kein Request Body gefunden',
        received: 'empty'
      });
    }
    
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
