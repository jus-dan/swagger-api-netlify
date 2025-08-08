const express = require('express');
const serverless = require('serverless-http');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

/**
 * @swagger
 * /hello:
 *   get:
 *     description: Eine einfache Begrüssung
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort
 */
router.get('/hello', (req, res) => {
  res.json({ message: 'Hallo aus deiner API!' });
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meine Swagger API',
      version: '1.0.0',
      description: 'API für einfache Begrüßungen',
    },
    servers: [
      {
        url: process.env.URL || 'http://localhost:8888',
        description: 'API Server',
      }
    ]
  },
  apis: ['./functions/api.js'],
});

app.use('/.netlify/functions/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);
