const express = require('express');
const serverless = require('serverless-http');
const swaggerUi = require('swagger-ui-express');

const app = express();

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

// Simple Swagger spec
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Makerspace API',
    version: '1.0.0',
    description: 'API für Makerspace-Verwaltung',
  },
  servers: [
    {
      url: 'http://localhost:8888/.netlify/functions',
      description: 'Local Server',
    },
    {
      url: 'https://radiant-maamoul-fab9c6.netlify.app/.netlify/functions',
      description: 'Production Server',
    }
  ],
  paths: {
    '/person': {
      get: {
        summary: 'Liste aller Personen',
        responses: {
          '200': {
            description: 'Erfolgreich',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      roles: { 
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Neue Person erstellen',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'roles'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  roles: { 
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Person erfolgreich erstellt'
          }
        }
      }
    },
    '/person/{id}': {
      get: {
        summary: 'Einzelne Person abrufen',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Erfolgreich'
          },
          '404': {
            description: 'Nicht gefunden'
          }
        }
      }
    },
    '/hello': {
      get: {
        summary: 'Einfache Begrüßung',
        responses: {
          '200': {
            description: 'Erfolgreich'
          }
        }
      }
    }
  }
};

app.use('/.netlify/functions/swagger-simple', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Makerspace API Documentation"
}));

module.exports.handler = serverless(app);
