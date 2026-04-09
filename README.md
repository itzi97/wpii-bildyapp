# BildyApp User Management API

Backend API for the BildyApp user management module built with Node.js, Express and MongoDB.

## Current progress
- Environment setup
- Express app setup
- Root route
- AppError class
- Centralized error handler
- Zod validation middleware
- MongoDB sanitization middleware

## Run locally

```bash
npm install
npm run dev
```

## Security note

The assignment requires Helmet, express-rate-limit and express-mongo-sanitize.
Helmet and express-rate-limit are used directly.

For sanitization, express-mongo-sanitize was tested but caused incompatibility
with Express 5 because it attempts to mutate `req.query`, which is read-only in 
Express 5. A custom sanitization middleware was implemented following class 
notes (T6 sanitization pattern) to preserve NoSQL injection protection on 
`req.body` and `req.params`.
