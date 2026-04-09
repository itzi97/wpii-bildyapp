# BildyApp User Management API

REST API backend for BildyApp user management. Complete user lifecycle from registration to admin invites, built with Node.js 22, Express 5, and MongoDB Atlas.

## Quick Start

```bash
git clone https://github.com/itzi97/wpii-bildyapp
cd bildyapp-api
npm install
cp .env.example .env
npm run dev
```

Server runs on `http://localhost:3000/api/user`.

## Tech Stack

- Node.js 22+ ESM (`--watch --env-file=.env`)
- Express 5 + middleware chain
- MongoDB Atlas + Mongoose (populate, virtuals, indexes)
- JWT auth (access + refresh tokens)
- Zod validation (`.transform()`, `.refine()`)
- Multer file uploads
- Helmet + rate limiting

## Environment

Copy `.env.example` and fill:

```bash
MONGODB_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
```
## API Flow

1. **Register** -> `POST /api/user/register` (JWT + 6-digit code)
2. **Validate** -> `PUT /api/user/validation` (check MongoDB for code)  
3. **Onboard** -> `PUT /api/user/register` (personal) + `PATCH /api/user/company` (CIF lookup)
4. **Upload** -> `PATCH /api/user/logo` (Multer)
5. **Admin** -> `POST /api/user/invite` (creates guest users)
6. **Session** -> `POST /api/user/refresh`, `POST /api/user/logout`
7. **Delete** -> `DELETE /api/user?soft=true` (soft delete)

Full examples in `requests.http`.

## Project Structure

```
bildyapp-api/
├── src/
│   ├── config/
│   │   └── index.js            # Centralized configuration
│   ├── controllers/
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verification
│   │   ├── error-handler.js    # Centralized middleware for errors
│   │   ├── role.middleware.js  # Role authorization
│   │   ├── upload.js           # Multer configuration
│   │   └── validate.js         # Zod middleware validation
│   ├── models/
│   │   ├── User.js             # Mongoose Model (virtuals and indixes)
│   │   └── Company.js          # Mongoose Model
│   ├── routes/
│   │   └── user.routes.js
│   ├── services/
│   │   └── notification.service.js  # EventEmitter for user events
│   ├── utils/
│   │   └── AppError.js         # Personalized error class
│   ├── validators/
│   │   └── user.validator.js   # Zod schemes (with transform and refine)
│   ├── app.js                  # Express configuration
│   └── index.js                # Entrypoint
├── uploads/                    # Uploaded files (such as logo)
├── .env                        # Not included in git
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Scripts

```json
{
  "dev": "node --watch --env-file=.env src/index.js",
  "start": "node --env-file=.env src/index.js"
}
```

## API Testing

- Can be executed with `curl` using the snippets from `requests.sh`.
- **REST Client** using `requests.http` such as Thunder Client or VS Code Rest Client.

---
UTAD Web Programming II Server assignment | Node.js + Express 5 + MongoDB
