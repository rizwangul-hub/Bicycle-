# Pixx Bicycle Owner's Declaration System

> **PixxTechnologiees — UK Bicycle Business**

A digital system for recording and retrieving Bicycle Owner's Declaration Forms across 6 PixxTechnologiees UK bicycle shops.

---

## Purpose

When a customer sells or provides a bicycle to a PixxTechnologiees shop, the shop records customer and bicycle information using a **Bicycle Owner's Declaration Form**. This application digitally stores these records so that shops and the PixxTechnologiees administration team can retrieve them when required — including when information is requested about a specific bicycle.

---

## Application Structure

```
/
├── backend/    ← Node.js / Express REST API
├── mobile/     ← React Native mobile app (Expo SDK 57) — shop users
└── web/        ← React admin dashboard — PixxTechnologiees administration
```

---

## The Six Shops

| Shop Name        | Shop Code  |
|-----------------|------------|
| Station Cycles   | STATION    |
| Camden Cycles    | CAMDEN     |
| Chelsea Bikes    | CHELSEA    |
| Edgware Cycles   | EDGWARE    |
| Southwark Cycles | SOUTHWARK  |
| Leebridge Cycles | LEEBRIDGE  |

---

## Technology Stack

| Layer    | Technology                                             |
|----------|-------------------------------------------------------|
| Backend  | Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs  |
| Mobile   | React Native, Expo SDK 57, TypeScript                 |
| Web      | React 19, Vite, TypeScript                            |
| Storage  | Cloudinary (Phase 3)                                  |

---

## Backend

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                    ← MongoDB connection
│   ├── controllers/
│   │   └── health.controller.js     ← Health check
│   ├── middleware/
│   │   ├── auth.middleware.js        ← JWT auth (Phase 2)
│   │   └── error.middleware.js      ← Centralised error handler
│   ├── models/
│   │   ├── Shop.model.js            ← 6 UK bicycle shops
│   │   ├── User.model.js            ← SHOP_USER / ADMIN roles
│   │   └── Declaration.model.js     ← Bicycle Owner's Declaration
│   ├── routes/
│   │   ├── index.js                 ← Route aggregator
│   │   ├── health.routes.js
│   │   ├── auth.routes.js           ← Phase 2
│   │   ├── shops.routes.js          ← Phase 2
│   │   ├── users.routes.js          ← Phase 2
│   │   ├── declarations.routes.js   ← Phase 2
│   │   ├── uploads.routes.js        ← Phase 3
│   │   └── admin.routes.js          ← Phase 2
│   ├── utils/
│   │   ├── asyncHandler.js          ← Async error wrapper
│   │   └── createError.js           ← HTTP error factory
│   ├── app.js                       ← Express app
│   └── server.js                    ← Server entry point
├── .env                             ← Local secrets (git-ignored)
├── .env.example                     ← Template — commit this
├── .gitignore
├── package.json
└── README.md
```

### Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
```

### Environment Variables

| Variable              | Description                              |
|----------------------|------------------------------------------|
| `PORT`               | Server port (default: 5000)              |
| `NODE_ENV`           | `development` or `production`            |
| `MONGODB_URI`        | MongoDB connection string                |
| `JWT_SECRET`         | JWT signing secret (min 32 chars)        |
| `JWT_EXPIRES_IN`     | JWT expiry (e.g. `7d`)                   |
| `CLIENT_URL`         | Mobile dev server origin (CORS)          |
| `ADMIN_WEB_URL`      | Web admin origin (CORS)                  |
| `CLOUDINARY_*`       | Cloudinary credentials (Phase 3)         |

### Development Commands

```bash
npm run dev     # Start with nodemon (auto-reload)
npm start       # Start production server
```

### API Health Check

```bash
GET http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "message": "Pixx Bicycle Owner Declaration API is running",
  "environment": "development",
  "database": "connected",
  "timestamp": "2026-09-22T10:00:00.000Z"
}
```

---

## Database Architecture

### Shop Model

Stores the six PixxTechnologiees UK shops. Shop names and codes are unique and cannot be duplicated.

```
Shop
├── _id
├── name       (unique) — e.g. "Southwark Cycles"
├── code       (unique) — e.g. "SOUTHWARK"
├── address
├── phone
├── email
├── isActive
├── createdAt
└── updatedAt
```

### User Model

Two roles: `SHOP_USER` and `ADMIN`.

- **SHOP_USER** — belongs to exactly one shop via `shopId`
- **ADMIN** — can access all shops; `shopId` is null

`passwordHash` is never returned by the API (`select: false`).

```
User
├── _id
├── name
├── email         (unique)
├── passwordHash  (select: false — never returned in API responses)
├── role          — SHOP_USER | ADMIN
├── shopId        → Shop (required for SHOP_USER, null for ADMIN)
├── isActive
├── lastLoginAt
├── createdAt
└── updatedAt
```

### Declaration Model

Based on the PixxTechnologiees paper Bicycle Owner's Declaration Form.

**Required fields:** `customerName`, `bicycleModel`, `shopId`

**Optional fields:** all other form fields

`shopId` is ALWAYS derived from the authenticated user's account — never from the mobile client's request body.

```
Declaration
├── _id
├── shopId              → Shop (from authenticated user — NEVER from client)
├── customerName        (required)
├── date
├── address
├── phone
├── cashPurchasePageNo
├── email
├── mobile
├── postcode
├── signature
├── sellerSignature
├── bicycleMake
├── bicycleModel        (required)
├── bicycleColour
├── frameNumber
├── distinguishingMarkings
├── bicycleSource
├── ownershipDuration
├── bicycleCost
├── bicycleFault
├── legalOwnerConfirmed
├── attachments
│   ├── bicyclePhotos       []
│   ├── customerPhotos      []
│   ├── idPhotos            []
│   └── additionalDocuments []
├── createdBy           → User
├── createdAt
└── updatedAt
```

---

## Shop Data Isolation

Each shop user can **only** access records belonging to their own shop.

```
Station Cycles user   → Station Cycles declarations only
Camden Cycles user    → Camden Cycles declarations only
Southwark Cycles user → Southwark Cycles declarations only
ADMIN                 → All 6 shops
```

The backend enforces this by reading `shopId` from `req.user.shopId` (set during authentication), never from the client request body.

---

## API Routes

| Route                       | Purpose                       | Phase |
|-----------------------------|-------------------------------|-------|
| `GET  /api/health`          | Health check (public)         | ✅ 1  |
| `POST /api/auth/login`      | Login → JWT                   | ✅ 2  |
| `GET  /api/auth/me`         | Current user profile          | ✅ 2  |
| `GET  /api/shops`           | List shops (admin)            | ✅ 2  |
| `GET  /api/declarations`    | List declarations (paginated) | ✅ 3  |
| `POST /api/declarations`    | Create declaration            | ✅ 3  |
| `GET  /api/declarations/:id`| Get single declaration by ID  | ✅ 3  |
| `PUT  /api/declarations/:id`| Update declaration            | ✅ 3  |
| `DELETE /api/declarations/:id`| Delete declaration          | ✅ 3  |
| `GET  /api/admin/dashboard` | Admin stats across 6 shops    | ✅ 3  |
| `POST /api/uploads/declaration/:id` | Upload files for declaration | ✅ 4 |
| `GET  /api/uploads/declaration/:id`  | Get grouped declaration files | ✅ 4 |
| `GET  /api/uploads/:id`              | Get single file details       | ✅ 4 |
| `DELETE /api/uploads/:id`           | Delete file from storage & DB | ✅ 4 |

---

## Declaration API Documentation (Phase 3)

### 1. Create Declaration
- **Endpoint:** `POST /api/declarations`
- **Auth:** Bearer Token required (`SHOP_USER` or `ADMIN`)
- **Required fields:** `customerName`, `bicycleModel`
- **Optional fields:** `date`, `address`, `phone`, `cashPurchasePageNo`, `email`, `mobile`, `postcode`, `signature`, `sellerSignature`, `bicycleMake`, `bicycleColour`, `frameNumber`, `distinguishingMarkings`, `bicycleSource`, `ownershipDuration`, `bicycleCost`, `bicycleFault`, `legalOwnerConfirmed`
- **Shop Security:**
  - For `SHOP_USER`: `shopId` is derived strictly from the authenticated account. Any client-sent `shopId` is ignored.
  - For `ADMIN`: `shopId` is required in the body and verified to exist and be active.

### 2. List Declarations
- **Endpoint:** `GET /api/declarations`
- **Auth:** Bearer Token required
- **Access Scope:**
  - `SHOP_USER`: Returns ONLY records belonging to user's shop (`req.user.shopId`). Query parameters cannot override this.
  - `ADMIN`: Returns records across all 6 shops. Can optionally filter with `?shopId=<id>`.
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `search` or `q`: Search across customer name, model, make, frame number, phone, mobile, email, cash purchase page no.
  - `customerName`, `bicycleModel`, `bicycleMake`, `frameNumber`: Specific field filters
  - `date`: Filter by date (`YYYY-MM-DD`)
  - `startDate`, `endDate`: Date range filter
  - `sortBy`: Whitelisted field (`createdAt`, `updatedAt`, `customerName`, `bicycleModel`, `bicycleMake`, `date`)
  - `sortOrder`: `asc` or `desc` (default: `desc`)

### 3. Get Single Declaration
- **Endpoint:** `GET /api/declarations/:id`
- **Auth:** Bearer Token required
- **Access Scope:**
  - `SHOP_USER`: Can only retrieve records belonging to their shop. Access to other shops returns `404 Not Found`.
  - `ADMIN`: Can retrieve records from any shop.

### 4. Update Declaration
- **Endpoint:** `PUT /api/declarations/:id`
- **Auth:** Bearer Token required
- **Access Scope:**
  - `SHOP_USER`: Can only update records belonging to their shop.
  - `ADMIN`: Can update records from any shop.
- **Protected Immutable Fields:** `shopId`, `createdBy`, `createdAt` cannot be modified.

### 5. Delete Declaration
- **Endpoint:** `DELETE /api/declarations/:id`
- **Auth:** Bearer Token required
- **Access Scope:**
  - `SHOP_USER`: Can only delete records belonging to their shop.
  - `ADMIN`: Can delete records from any shop.
- **Cascade Cleanup:** Deleting a declaration automatically purges associated attachments from Cloudinary and the database.

---

## File & Image Upload API Documentation (Phase 4)

### 1. Upload Declaration Attachments
- **Endpoint:** `POST /api/uploads/declaration/:declarationId`
- **Auth:** Bearer Token required (`SHOP_USER` or `ADMIN`)
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `category` (required): `BICYCLE` | `CUSTOMER` | `ID` | `ADDITIONAL`
  - `files` (required): One or multiple files (up to 10 files per request)
- **Supported Formats:** JPG, JPEG, PNG, WEBP, PDF (executables like `.exe`, `.bat`, scripts are strictly rejected).
- **Size Limit:** Configured via `MAX_FILE_SIZE_MB` (default: 10MB per file).
- **Storage Organization:** Cloudinary storage path: `pixx-bicycle-declarations/{shopCode}/{declarationId}/{category}/`.
- **Shop Security:** Shop users can only upload files to declarations belonging to their shop.

### 2. Get Declaration Attachments
- **Endpoint:** `GET /api/uploads/declaration/:declarationId`
- **Auth:** Bearer Token required
- **Response Format:**
  ```json
  {
    "success": true,
    "data": {
      "declarationId": "...",
      "totalAttachments": 4,
      "grouped": {
        "BICYCLE": [ ... ],
        "CUSTOMER": [ ... ],
        "ID": [ ... ],
        "ADDITIONAL": [ ... ]
      }
    }
  }
  ```

### 3. Get Single Attachment Details
- **Endpoint:** `GET /api/uploads/:attachmentId`
- **Auth:** Bearer Token required
- **Shop Security:** Shop users can only view attachments belonging to their shop. Cross-shop access returns `404 Not Found`.

### 4. Delete Attachment
- **Endpoint:** `DELETE /api/uploads/:attachmentId`
- **Auth:** Bearer Token required
- **Shop Security:** Shop users can only delete attachments belonging to their shop.
- **Storage Cleanup:** Removes the file from Cloudinary and deletes the record from MongoDB.

---

## MongoDB Setup

### Local Development

1. Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Start MongoDB: `mongod`
3. Set `MONGODB_URI=mongodb://localhost:27017/pixx-bicycle` in `.env`

### MongoDB Atlas (Production)

1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user with readWrite permissions
3. Get the connection string and set as `MONGODB_URI` in `.env`

---

*Phase 1 — Foundation complete. Authentication, declaration CRUD, and image uploads will be implemented in subsequent phases.*
