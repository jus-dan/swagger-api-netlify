const express = require('express');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Minimal middleware
app.use(express.json());

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Test OK' });
});

// Minimal register route
router.post('/register', (req, res) => {
  res.json({ 
    message: 'Register OK',
    body: req.body 
  });
});

app.use('/.netlify/functions/organization', router);

module.exports.handler = serverless(app);
