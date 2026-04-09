# BildyApp User Management API

Backend API for the BildyApp user management module built with Node.js, Express and MongoDB.


## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` with MongoDB URI, JWT secrets and app config.

## Run locally

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`.


## Current progress

- User registration with JWT access and refresh tokens
- Email validation with verification code and attempt limit
- Login with hashed passwords using bcryptjs
- Protected password change endpoint with Zod `.refine()`
- Centralized error handling with `AppError`
- Request validation with Zod
- MongoDB models with Mongoose, indexes and virtual `fullName`
- Security middleware with Helmet, rate limiting and custom sanitization

## API examples

TODO: Example requests are included in `bildyapp.http`.

## Security note

The assignment requires Helmet, express-rate-limit and express-mongo-sanitize.
Helmet and express-rate-limit are used directly.

For sanitization, express-mongo-sanitize was tested but caused incompatibility
with Express 5 because it attempts to mutate `req.query`, which is read-only in 
Express 5. A custom sanitization middleware was implemented following class 
notes (T6 sanitization pattern) to preserve NoSQL injection protection on 
`req.body` and `req.params`.
