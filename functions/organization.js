const express = require('express');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Middleware - vereinfacht
app.use(express.json());

// ========================================
// TEST ROUTE
// ========================================

router.get('/test', (req, res) => {
  console.log('🧪 GET /test aufgerufen');
  res.json({ 
    message: 'Organization API läuft!',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// SIMPLE REGISTER (ohne Validierung)
// ========================================

router.post('/register', (req, res) => {
  console.log('🔄 POST /register empfangen');
  console.log('📋 Request Body:', req.body);
  console.log('📋 Request Headers:', req.headers);
  
  // Einfache Antwort ohne Validierung
  res.status(200).json({
    message: 'Test erfolgreich!',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// ========================================
// ROUTES SETUP
// ========================================

app.use('/.netlify/functions/organization', router);

module.exports.handler = serverless(app);
