const express = require('express');
const serverless = require('serverless-http');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const router = express.Router();

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
    },
  },
  apis: ['./functions/api.js'],
});

app.use('/.netlify/functions/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);
