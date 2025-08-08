const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.get('/.netlify/functions/test', (req, res) => {
  res.json({ 
    message: 'Test function works!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

module.exports.handler = serverless(app);
