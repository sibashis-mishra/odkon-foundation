# API Reference — odkon-foundation

**Base URL:** `http://localhost:3000/api/v1`  
**Content-Type:** `application/json`

---

## Common Patterns

### Success Response
```json
{ "data": { ... } }
```

### Paginated Success Response
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 87, "totalPages": 5 }
}
```

### Error Response
```json
{ "error": { "message": "...", "code": "..." } }
```

### Validation Error Response (400)
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": { "email": ["Must be a valid email"] }
  }
}
```

### Authentication Header
```
Authorization: Bearer <accessToken>
```

### Pagination Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `createdAt:desc` | Format: `field:asc` or `field:desc` |
| `search` | string | — | Full-text search |

---

## Health Check

### `GET /health`
**Auth:** None  
**Response:**
```json
{ "status": "ok", "service": "odkon-foundation", "timestamp": "2026-07-11T06:30:00.000Z" }
```

---

## Auth — `/api/v1/auth`

> All auth routes are rate-limited to 20 requests / 15 minutes per IP.

---

### `POST /auth/login`
**Auth:** None  
**Request Body:**
```json
{ "email": "admin@odkon.com", "password": "Admin@1234" }
```
**Response 200:**
```json
{
  "data": {
    "accessToken": "<JWT>",
    "user": {
      "id": "clxxx",
      "name": "Admin User",
      "email": "admin@odkon.com",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```
> Sets `odkon_refresh` HttpOnly cookie with refresh token.

**Response 401:** Invalid credentials

---

### `POST /auth/refresh`
**Auth:** `odkon_refresh` cookie  
**Request Body:** None  
**Response 200:**
```json
{ "data": { "accessToken": "<newJWT>" } }
```
> Rotates the refresh token (old cookie cleared, new one set).

**Response 401:** Token expired or revoked

---

### `POST /auth/logout`
**Auth:** `odkon_refresh` cookie  
**Request Body:** None  
**Response 200:**
```json
{ "data": { "message": "Logged out successfully" } }
```
> Deletes the refresh token from DB and clears the cookie.

---

### `GET /auth/me`
**Auth:** Bearer token  
**Response 200:**
```json
{
  "data": {
    "id": "clxxx",
    "name": "Admin User",
    "email": "admin@odkon.com",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Users — `/api/v1/users`

> All endpoints require authentication.

---

### `GET /users`
**Auth:** MANAGER+  
**Query Params:** `page`, `limit`, `sort`, `search`, `role` (`ADMIN|MANAGER|STAFF`), `isActive` (`true|false`)  
**Response 200:** Paginated array of user objects (no `passwordHash`)

---

### `GET /users/:id`
**Auth:** MANAGER+  
**Response 200:** Single user object  
**Response 404:** User not found

---

### `POST /users`
**Auth:** ADMIN only  
**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@odkon.com",
  "password": "SecurePass@123",
  "role": "STAFF"
}
```
**Response 201:** Created user object (no `passwordHash`)  
**Response 409:** Email already in use

---

### `PATCH /users/:id`
**Auth:** ADMIN only  
**Request Body:** (all fields optional, at least one required)
```json
{
  "name": "Updated Name",
  "email": "new@email.com",
  "role": "MANAGER",
  "isActive": false
}
```
**Response 200:** Updated user object  
**Response 404:** User not found  
**Response 409:** Email conflict

---

### `DELETE /users/:id`
**Auth:** ADMIN only  
**Response 200:** `{ "data": { "message": "User deleted successfully" } }`  
**Response 400:** Cannot delete your own account  
**Response 404:** User not found

---

## Clients — `/api/v1/clients`

> All endpoints require authentication.

---

### `GET /clients`
**Auth:** STAFF+  
**Query Params:** `page`, `limit`, `sort`, `search` (matches companyName, contactName, contactEmail), `status` (`ACTIVE|INACTIVE|LEAD`)  
**Response 200:** Paginated array of client objects

---

### `GET /clients/:id`
**Auth:** STAFF+  
**Response 200:** Client object with nested `projects` array  
**Response 404:** Client not found

---

### `POST /clients`
**Auth:** MANAGER+  
**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "contactName": "Alice Johnson",
  "contactEmail": "alice@acme.com",
  "contactPhone": "+1-555-0100",
  "notes": "Key enterprise account.",
  "status": "ACTIVE"
}
```
**Required:** `companyName`, `contactName`, `contactEmail`  
**Response 201:** Created client object

---

### `PATCH /clients/:id`
**Auth:** MANAGER+  
**Request Body:** (all fields optional)
```json
{ "status": "ACTIVE", "notes": "Updated notes." }
```
**Response 200:** Updated client object  
**Response 404:** Client not found

---

### `DELETE /clients/:id`
**Auth:** ADMIN only  
**Response 200:** `{ "data": { "message": "Client deleted successfully" } }`  
**Response 400:** Client has associated projects — delete or reassign them first  
**Response 404:** Client not found

---

## Projects — `/api/v1/projects`

> All endpoints require authentication.

---

### `GET /projects`
**Auth:** STAFF+  
**Query Params:** `page`, `limit`, `sort`, `search` (matches name, description), `status` (`PLANNING|IN_PROGRESS|ON_HOLD|COMPLETED|CANCELLED`), `clientId`  
**Response 200:** Paginated array of project objects (includes client, createdBy, assignments)

---

### `GET /projects/:id`
**Auth:** STAFF+  
**Response 200:** Full project object with client, creator, and all assignments  
**Response 404:** Project not found

---

### `POST /projects`
**Auth:** MANAGER+  
**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Full redesign of the public website.",
  "status": "PLANNING",
  "startDate": "2026-08-01T00:00:00.000Z",
  "endDate": "2026-12-31T00:00:00.000Z",
  "budget": 30000,
  "clientId": "clxxx"
}
```
**Required:** `name`, `startDate`, `clientId`  
**Response 201:** Created project object  
**Response 404:** Client not found

---

### `PATCH /projects/:id`
**Auth:** MANAGER+  
**Request Body:** (all fields optional)
```json
{ "status": "IN_PROGRESS", "budget": 35000 }
```
**Response 200:** Updated project object  
**Response 404:** Project / client not found

---

### `DELETE /projects/:id`
**Auth:** ADMIN only  
**Response 200:** `{ "data": { "message": "Project deleted successfully" } }`  
**Response 404:** Project not found

---

### `POST /projects/:id/assignments`
**Auth:** MANAGER+  
**Request Body:**
```json
{
  "userId": "clxxx",
  "roleOnProject": "Front-end Developer"
}
```
**Response 201:** Assignment object with user and project info  
**Response 404:** Project or user not found  
**Response 409:** User already assigned

---

### `DELETE /projects/:id/assignments/:userId`
**Auth:** MANAGER+  
**Response 200:** `{ "data": { "message": "User successfully removed from project" } }`  
**Response 404:** Assignment not found

---

## Dashboard — `/api/v1/dashboard`

> All endpoints require authentication.

---

### `GET /dashboard/kpis`
**Auth:** STAFF+  
**Response 200:**
```json
{
  "data": {
    "summary": {
      "totalActiveClients": 12,
      "totalLeads": 4,
      "totalActiveProjects": 8
    },
    "projectsByStatus": {
      "PLANNING": 3,
      "IN_PROGRESS": 4,
      "ON_HOLD": 1,
      "COMPLETED": 15,
      "CANCELLED": 2
    },
    "projectsDueSoon": [
      {
        "id": "clxxx",
        "name": "Acme Website Redesign",
        "status": "IN_PROGRESS",
        "endDate": "2026-08-31T00:00:00.000Z",
        "client": { "id": "clyyy", "companyName": "Acme Corp" },
        "assignments": [
          { "user": { "id": "clzzz", "name": "Jane Manager" } }
        ]
      }
    ],
    "recentClients": [
      {
        "id": "clyyy",
        "companyName": "Initech Solutions",
        "contactName": "Carol Williams",
        "status": "LEAD",
        "createdAt": "2026-07-10T12:00:00.000Z"
      }
    ],
    "generatedAt": "2026-07-11T06:30:00.000Z"
  }
}
```

**Notes:**
- `projectsDueSoon`: projects with `endDate` within the next 30 days that are not COMPLETED/CANCELLED
- `recentClients`: last 10 clients ordered by creation date
- All status keys are always present in `projectsByStatus` (with 0 if empty)

---

## Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid access token |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_INACTIVE` | 401 | User account is disabled |
| `FORBIDDEN` | 403 | Authenticated but insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Unique constraint violation |
| `HAS_DEPENDENCIES` | 400 | Cannot delete — has linked records |
| `BAD_REQUEST` | 400 | General bad request |
| `VALIDATION_ERROR` | 400 | Request body/query failed Zod validation |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
