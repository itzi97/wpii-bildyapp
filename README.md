# BildyApp API

Backend REST API for the BildyApp construction management platform. Built with Node.js, Express, and MongoDB as the final project for the Web Server Programming II course.

The API handles user authentication, company and client management, project tracking, and digitally-signed delivery notes with PDF generation.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22 (ESM) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| File storage | Cloudinary |
| PDF generation | pdfkit |
| Real-time events | Socket.IO |
| Email | Nodemailer |
| Error logging | Slack Incoming Webhooks |
| Testing | Jest + Supertest + mongodb-memory-server |
| Documentation | Swagger UI (swagger-jsdoc + swagger-ui-express) |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill in your values
cp .env.example .env

# 3. Start the development server (loads .env automatically via --env-file)
npm run dev
```

The API will be available at `http://localhost:3000`.  
Interactive API docs: `http://localhost:3000/api-docs`

## Environment Variables

Copy `.env.example` and fill in every value before running the server.

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: `3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens |
| `JWT_EXPIRES_IN` | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. `7d`) |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | Sender address |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL for error logging |
| `FRONTEND_URL` | Allowed CORS origin |

## API Overview

All routes are prefixed with `/api`.

| Resource | Base path | Description |
|---|---|---|
| Users | `/api/user` | Registration, login, email validation, onboarding, password management |
| Clients | `/api/client` | Client CRUD scoped to the authenticated user's company |
| Projects | `/api/project` | Project CRUD linked to a client and company |
| Delivery Notes | `/api/deliverynote` | Delivery note CRUD, digital signing, and PDF generation |
| Health | `/api/health` | Server and database status check |

Full endpoint documentation is available at `/api-docs` when the server is running.

## Project Structure

```
bildyapp-api/
├── src/
│   ├── index.js              # Entry point — starts HTTP server, handles graceful shutdown
│   ├── app.js                # Express app setup — middleware, routes, Socket.IO, Swagger
│   ├── config/
│   │   ├── index.js          # Centralised environment variable config
│   │   ├── db.js             # Mongoose connection
│   │   └── swagger.js        # Swagger/OpenAPI spec with all component schemas
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── client.controller.js
│   │   ├── project.controller.js
│   │   └── deliverynote.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification, attaches req.user
│   │   ├── role.middleware.js   # Role-based access control
│   │   ├── validate.js          # Zod schema validation factory
│   │   ├── sanitize.js          # NoSQL injection protection
│   │   ├── upload.js            # Multer in-memory upload config
│   │   └── error-handler.js     # Centralised error handler (AppError + Slack logging)
│   ├── models/
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   └── DeliveryNote.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── client.routes.js
│   │   ├── project.routes.js
│   │   └── deliverynote.routes.js
│   ├── services/
│   │   ├── logger.service.js       # Slack error webhook
│   │   ├── mail.service.js         # Nodemailer email sending
│   │   ├── notification.service.js # Socket.IO company-room event emitter
│   │   ├── pdf.service.js          # PDFKit delivery note generation
│   │   └── storage.service.js      # Cloudinary upload/delete
│   ├── utils/
│   │   └── AppError.js             # Custom operational error class
│   └── validators/
│       ├── user.validator.js
│       ├── client.validator.js
│       ├── project.validator.js
│       └── deliverynote.validator.js
├── tests/
│   ├── auth.test.js
│   ├── client.test.js
│   ├── project.test.js
│   └── deliverynote.test.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── jest.config.js
├── requests.http             # Example HTTP requests for all endpoints
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the server (production) |
| `npm run dev` | Start with nodemon (auto-reload on file changes) |
| `npm test` | Run the full Jest test suite |
| `npm run test:coverage` | Run tests and generate a coverage report |

## Testing

Tests use **Jest + Supertest** with an **in-memory MongoDB** instance (`mongodb-memory-server`) so no real database is required. Each test file spins up a fresh database and tears it down after all tests complete.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Target branch coverage: **≥ 70%**

## Real-time Events (Socket.IO)

The API emits real-time events to company-scoped Socket.IO rooms. Clients must authenticate with a JWT on connection:

```js
const socket = io('http://localhost:3000', {
  auth: { token: '<your-jwt>' }
});

socket.emit('join-company', companyId);

socket.on('client:new',           (client)       => { /* new client created */ });
socket.on('project:new',          (project)      => { /* new project created */ });
socket.on('delivery-note:new',    (deliveryNote) => { /* new delivery note */ });
socket.on('delivery-note:signed', (deliveryNote) => { /* note was signed */ });
```

## Error Responses

All errors follow a consistent JSON shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

Validation errors include a `details` array:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "body.email", "message": "Invalid email" }
  ]
}
```
