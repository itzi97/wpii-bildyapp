// src/config/swagger.js
// Centralised Swagger/OpenAPI configuration.
// swaggerJsdoc scans the route files for @swagger JSDoc comments and merges
// them with the base definition below to produce the full OpenAPI spec.
// swaggerUi.serve + swaggerUi.setup are exported ready to mount in app.js.
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Base OpenAPI definition, route-level docs live in src/routes/*.js
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BildyApp API',
      version: '2.0.0',
      description: 'REST API for BildyApp — manages users, companies, clients, projects, and delivery notes.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
    components: {
      // JWT bearer auth scheme, applied globally via the 'security' field below
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      // Reusable response schemas referenced in routes via $ref
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1f2e8b1c2d3e4f5a6b7c' },
            email: { type: 'string', example: 'user@bildyapp.com' },
            name: { type: 'string', example: 'Ana' },
            lastName: { type: 'string', example: 'García' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Bildy SL' },
            cif: { type: 'string', example: 'B12345678' },
            isFreelance: { type: 'boolean' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Constructora Norte SA' },
            cif: { type: 'string', example: 'A87654321' },
            email: { type: 'string', example: 'contact@norte.com' },
            phone: { type: 'string', example: '911234567' },
            deleted: { type: 'boolean', default: false },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Reforma Oficinas BCN' },
            projectCode: { type: 'string', example: 'BCN-2024-01' },
            client: { type: 'string', description: 'Client _id reference' },
            active: { type: 'boolean', default: true },
            deleted: { type: 'boolean', default: false },
          },
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            format: { type: 'string', enum: ['hours', 'material'] },
            description: { type: 'string', example: 'Installation of electrical panels' },
            workDate: { type: 'string', format: 'date-time' },
            hours: { type: 'number', example: 8 },
            signed: { type: 'boolean', default: false },
            signedAt: { type: 'string', format: 'date-time', nullable: true },
            signatureUrl: { type: 'string', nullable: true },
            deleted: { type: 'boolean', default: false },
          },
        },
      },
    },
    // All endpoints require JWT auth by default unless overridden per-route
    security: [{ bearerAuth: [] }],
  },
  // Glob pattern, swaggerJsdoc reads @swagger blocks from all route files
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerServe = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(swaggerSpec);
