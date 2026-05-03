// src/config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'REST API for BildyApp delivery notes management',
    },
    server: [{ url: 'http://localhost:3000', description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            cif: { type: 'string' },
            isFreelance: { type: 'boolean' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            cif: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            deleted: { type: 'boolean' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            projectCode: { type: 'string' },
            client: { type: 'string' },
            active: { type: 'boolean' },
            deleted: { type: 'boolean' },
          },
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            format: { type: 'string', enum: ['hours', 'material'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date-time' },
            hours: { type: 'number' },
            signed: { type: 'boolean' },
            signedAt: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerServe = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(swaggerSpec);
