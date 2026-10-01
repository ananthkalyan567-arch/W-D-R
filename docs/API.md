# ASR WATER & DRAINAGE - REST API SPECIFICATION (v1)

> **Civic-Tech Platform for Alluri Sitharama Raju District, Andhra Pradesh, India**  
> **Tagline:** Report. Track. Improve.  
> **Base URL:** `/api/v1`  
> **Protocol:** HTTP/HTTPS with JSON payloads  
> **Character Encoding:** UTF-8 / UTF8mb4 (Full English and Telugu support)

---

## Table of Contents
1. [General Conventions & Security](#1-general-conventions--security)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Authentication Endpoints](#3-authentication-endpoints)
4. [Citizen Complaint Endpoints](#4-citizen-complaint-endpoints)
5. [Public Map Endpoints](#5-public-map-endpoints)
6. [Administrator Complaint Management](#6-administrator-complaint-management)
7. [Hierarchical Location Management](#7-hierarchical-location-management)
8. [Problem Category Management](#8-problem-category-management)
9. [Organization Management](#9-organization-management)
10. [User & Privilege Management](#10-user--privilege-management)
11. [Analytics & Insights](#11-analytics--insights)
12. [Notifications & CSV Reports](#12-notifications--csv-reports)
13. [Standard Error Codes & Handling](#13-standard-error-codes--handling)

---

## 1. General Conventions & Security

### Response Format
All responses are formatted in standardized JSON:

#### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Complaint submitted successfully.",
  "data": {
    "complaint": {
      "id": 14,
      "complaint_number": "ASR-WD-000014",
      "status": "submitted"
    }
  }
}
```

#### Paginated Collection Response
```json
{
  "success": true,
  "message": "Complaints retrieved successfully.",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 128,
    "total_pages": 7
  }
}
```

#### Error Response (HTTP 400 / 401 / 403 / 404 / 422 / 500)
```json
{
  "success": false,
  "message": "Validation failed on input data.",
  "error_code": "VALIDATION_FAILED",
  "errors": {
    "location_id": "Location is required.",
    "description": "Description must be at least 10 characters."
  }
}
```

### Privacy & Data Protection Rules
- **No Private Citizen Leaks:** Citizen phone numbers, emails, and exact residential coordinates are never exposed in public endpoints (`/complaints`, `/map/complaints`, `/complaints/track`).
- **Internal vs. Public Notes:** Internal notes (`is_public = 0`) are restricted to administrators and authorized organizations.

---

## 2. Authentication & Authorization

Authentication is handled via **Bearer Tokens** in the HTTP `Authorization` header or secure **HTTP-Only Cookies**.

```http
Authorization: Bearer <secure_session_token>
```

### Roles & Permissions Hierarchy
| Role | Identifier | Capabilities |
|---|---|---|
| **Super Admin** | `super_admin` | Unrestricted access: user management, audits, locations, organizations, complaints, reports. |
| **Admin** | `admin` | Manage complaints, assignments, triage, locations, categories, view analytics & audit logs. |
| **Organization Admin** | `organization_admin` | Access only complaints assigned to their designated maintenance entity or team. |
| **Citizen** | `citizen` | Register, log in, submit complaints, view own complaints, track public timelines. |

---

## 3. Authentication Endpoints

### 3.1 Register Citizen Account
Registers a new resident or volunteer citizen account.

- **Method:** `POST`
- **URL:** `/api/v1/auth/register`
- **Authentication:** None (Public)
- **Request Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "name": "Ramu Goud",
  "email": "ramu.goud@example.com",
  "phone": "9876543210",
  "password": "Password123!",
  "preferred_language": "te"
}
```

#### Responses
- **201 Created**
```json
{
  "success": true,
  "message": "Registration successful. You may now log in.",
  "data": {
    "user": {
      "id": 12,
      "name": "Ramu Goud",
      "email": "ramu.goud@example.com",
      "role": "citizen"
    }
  }
}
```
- **422 Unprocessable Entity:** `EMAIL_ALREADY_EXISTS`, `INVALID_PHONE`, `WEAK_PASSWORD`

---

### 3.2 User Login
Authenticates an existing user and returns a secure session token.

- **Method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Authentication:** None (Public)

#### Request Body
```json
{
  "email": "admin@asr.gov.in",
  "password": "admin123"
}
```

#### Responses
- **200 OK**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "7a8b9c0d1e2f3g4h...",
    "user": {
      "id": 1,
      "name": "ASR District Administrator",
      "email": "admin@asr.gov.in",
      "role": "super_admin",
      "preferred_language": "en"
    }
  }
}
```
- **401 Unauthorized:** `INVALID_CREDENTIALS`
- **403 Forbidden:** `ACCOUNT_SUSPENDED`

---

### 3.3 Get Current Authenticated Profile
- **Method:** `GET`
- **URL:** `/api/v1/auth/me`
- **Authentication:** Required (`citizen`, `admin`, `super_admin`, `organization_admin`)

#### Responses
- **200 OK** Returns the current user's profile without exposing `password_hash`.
- **401 Unauthorized:** `UNAUTHORIZED`

---

### 3.4 User Logout
Invalidates the current session token.
- **Method:** `POST`
- **URL:** `/api/v1/auth/logout`
- **Authentication:** Required

---

### 3.5 Forgot & Reset Password
- **Method:** `POST /api/v1/auth/forgot-password`
  - Body: `{"email": "user@example.com"}`
- **Method:** `POST /api/v1/auth/reset-password`
  - Body: `{"token": "reset_token_xyz", "password": "NewStrongPassword123!"}`

---

## 4. Citizen Complaint Endpoints

### 4.1 Submit a Complaint
Submits a water supply or drainage issue. Supports multipart form data for photo evidence.

- **Method:** `POST`
- **URL:** `/api/v1/complaints`
- **Authentication:** Optional (authenticated citizen accounts link user ID; anonymous citizens submit safely)
- **Content-Type:** `multipart/form-data` or `application/json`

#### Request Parameters / Body
| Parameter | Type | Required | Description |
|---|---|---|---|
| `location_id` | Integer | Yes | ID of the mandal/village from `/api/v1/locations` |
| `category_id` | Integer | Yes | ID of the problem category from `/api/v1/categories` |
| `title` | String | No | Short headline (auto-generated if omitted) |
| `description` | String | Yes | Minimum 10 characters describing the issue |
| `landmark` | String | No | Local landmark, near school/temple/hospital |
| `latitude` | Float | No | Geolocation latitude (-90 to +90) |
| `longitude` | Float | No | Geolocation longitude (-180 to +180) |
| `citizen_severity` | String | No | `low`, `medium`, `high`, `critical` (default: `medium`) |
| `photo` | File | No | Safe JPEG/PNG/WebP image (max 5MB) |

#### Responses
- **201 Created**
```json
{
  "success": true,
  "message": "Complaint submitted successfully.",
  "data": {
    "complaint": {
      "id": 15,
      "complaint_number": "ASR-WD-000015",
      "status": "submitted",
      "citizen_severity": "high",
      "photo_path": "uploads/asr_complaint_673e4b.jpg",
      "created_at": "2026-09-29 13:00:00"
    },
    "ai_check": {
      "status": "checked",
      "possible_duplicate": false
    }
  }
}
```

---

### 4.2 Track Complaint by Complaint Number
Public tracking endpoint using human-readable ID (e.g. `ASR-WD-000001`).

- **Method:** `GET`
- **URL:** `/api/v1/complaints/track?number=ASR-WD-000001`
- **Authentication:** None (Public)

#### Responses
- **200 OK**
```json
{
  "success": true,
  "message": "Complaint details retrieved.",
  "data": {
    "complaint": {
      "complaint_number": "ASR-WD-000001",
      "title": "Low water pressure in main market",
      "location_name": "Paderu",
      "location_name_te": "పాడేరు",
      "category_name": "Low water pressure",
      "category_type": "water",
      "status": "in_progress",
      "created_at": "2026-09-28 09:30:00"
    },
    "timeline": [
      {
        "status": "submitted",
        "message": "Complaint registered by citizen.",
        "created_at": "2026-09-28 09:30:00"
      },
      {
        "status": "in_progress",
        "message": "Field inspection team dispatched.",
        "created_at": "2026-09-28 11:00:00"
      }
    ]
  }
}
```
- **404 Not Found:** `COMPLAINT_NOT_FOUND`

---

### 4.3 Get Complaint Timeline
- **Method:** `GET`
- **URL:** `/api/v1/complaints/{id}/timeline`
- **Authentication:** None (Public - only public entries exposed)

---

## 5. Public Map Endpoints

### 5.1 Get Map Geolocation Data
Returns privacy-sanitized complaint markers across ASR District for Leaflet.js visualization.

- **Method:** `GET`
- **URL:** `/api/v1/map/complaints`
- **Authentication:** None (Public)
- **Query Parameters:**
  - `location_id` (int, optional)
  - `type` (`water` | `drainage`, optional)
  - `status` (`submitted`, `in_progress`, `resolved`, etc.)
  - `priority` (`low`, `medium`, `high`, `critical`)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Map markers loaded.",
  "data": [
    {
      "id": 1,
      "complaint_number": "ASR-WD-000001",
      "title": "Main Pipeline Leakage near RTC Complex",
      "category_name": "Pipeline damage",
      "category_type": "water",
      "location_name": "Paderu",
      "latitude": 18.0833,
      "longitude": 82.6667,
      "status": "in_progress",
      "system_priority": "high",
      "created_at": "2026-09-28 09:30:00"
    }
  ]
}
```

---

## 6. Administrator Complaint Management

All endpoints in this section require `Authorization: Bearer <admin_token>`.

### 6.1 Administrator Dashboard Summary
- **Method:** `GET`
- **URL:** `/api/v1/admin/dashboard`
- **Authentication:** `admin` or `super_admin`

#### Response
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_complaints": 142,
      "new_complaints": 24,
      "under_review": 18,
      "assigned": 31,
      "in_progress": 42,
      "resolved": 19,
      "closed": 5,
      "rejected": 3,
      "critical_complaints": 12,
      "water_complaints": 88,
      "drainage_complaints": 54
    },
    "recent_complaints": [ ... ]
  }
}
```

---

### 6.2 Assign Complaint
Assigns a complaint to a maintenance organization or designated field user within an ACID database transaction.

- **Method:** `POST`
- **URL:** `/api/v1/admin/complaints/{id}/assign`
- **Body:**
```json
{
  "organization_id": 1,
  "assigned_user_id": 4,
  "notes": "Emergency field team assigned to repair pipe breach."
}
```

---

### 6.3 Update Status (State Machine)
- **Method:** `POST`
- **URL:** `/api/v1/admin/complaints/{id}/status`
- **Body:**
```json
{
  "status": "in_progress",
  "message": "Excavation and line repair started on site.",
  "is_public": true
}
```

---

### 6.4 Resolve Complaint
- **Method:** `POST`
- **URL:** `/api/v1/admin/complaints/{id}/resolve`
- **Body:**
```json
{
  "resolution_notes": "Replaced ruptured 4-inch valve. Pressure restored."
}
```

---

### 6.5 Reject or Mark Duplicate
- **POST `/api/v1/admin/complaints/{id}/reject`**
  - Body: `{"rejection_reason": "Not within public municipal jurisdiction."}`
- **POST `/api/v1/admin/complaints/{id}/duplicate`**
  - Body: `{"original_complaint_id": 10}`

---

### 6.6 Administrative Audit Logs
- **Method:** `GET`
- **URL:** `/api/v1/admin/audit-logs?page=1&limit=50`
- **Authentication:** `super_admin` or `admin`

---

## 7. Hierarchical Location Management

### 7.1 List Locations (Hierarchy)
- **Method:** `GET`
- **URL:** `/api/v1/locations`
- **Query Parameters:** `parent_id` (optional, for child villages), `status` (default: `active`)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paderu",
      "name_te": "పాడేరు",
      "location_type": "mandal",
      "latitude": 18.0833,
      "longitude": 82.6667,
      "parent_id": null,
      "children_count": 8,
      "complaints_count": 42
    }
  ]
}
```

---

### 7.2 Admin: Create Location
- **Method:** `POST`
- **URL:** `/api/v1/admin/locations`
- **Body:**
```json
{
  "name": "Minumuluru Village",
  "name_te": "మినుములూరు",
  "parent_id": 1,
  "location_type": "village",
  "latitude": 18.0500,
  "longitude": 82.7000
}
```

---

### 7.3 Admin: Update & Soft Disable Location
- **PATCH `/api/v1/admin/locations/{id}`**
- **DELETE `/api/v1/admin/locations/{id}`** (Soft disables location so historical complaints remain valid).

---

## 8. Problem Category Management

- **`GET /api/v1/categories`** - Retrieve active water and drainage problem categories.
- **`POST /api/v1/admin/categories`** - Add a new category.
- **`PATCH /api/v1/admin/categories/{id}`** - Edit title or Telugu translation.
- **`DELETE /api/v1/admin/categories/{id}`** - Deactivate category safely.

---

## 9. Organization Management

- **`GET /api/v1/organizations`** - Public listing of registered maintenance partners.
- **`POST /api/v1/admin/organizations`** - Register a maintenance agency.
- **`GET /api/v1/organization/complaints`** - Organization portal: returns only complaints assigned to the authenticated user's organization.

---

## 10. User & Privilege Management

Super Administrator endpoints for user account administration:
- **`GET /api/v1/admin/users`** - List users with filter by role and status.
- **`PATCH /api/v1/admin/users/{id}`** - Update user profile.
- **`POST /api/v1/admin/users/{id}/suspend`** - Suspend user access immediately.
- **`POST /api/v1/admin/users/{id}/activate`** - Re-activate suspended account.

---

## 11. Analytics & Insights

Endpoints providing aggregated data for charts and reporting:
- **`GET /api/v1/admin/analytics`** - High-level summary metrics.
- **`GET /api/v1/admin/analytics/trends`** - Daily/monthly trend aggregation.
- **`GET /api/v1/admin/analytics/categories`** - Category breakdown.
- **`GET /api/v1/admin/analytics/locations`** - Geographic hotspot distribution.
- **`GET /api/v1/admin/analytics/resolution-time`** - Mean time to resolution (MTTR) in hours.

---

## 12. Notifications & CSV Reports

- **`GET /api/v1/notifications`** - Get current user notifications.
- **`POST /api/v1/notifications/{id}/read`** - Mark notification as read.
- **`GET /api/v1/admin/reports/csv?type=complaints&date_from=2026-09-01&date_to=2026-09-30`**  
  Streams a CSV report directly for Excel/BI import.

---

## 13. Standard Error Codes & Handling

| HTTP Status | Error Code | Meaning |
|---|---|---|
| `400` | `BAD_REQUEST` | Malformed JSON or missing parameter |
| `401` | `UNAUTHORIZED` | Token missing or invalid |
| `403` | `FORBIDDEN` | Insufficient role permissions |
| `404` | `NOT_FOUND` | Resource does not exist |
| `409` | `CONFLICT` | Resource already exists or state collision |
| `422` | `VALIDATION_FAILED` | Input fields failed validation rules |
| `429` | `RATE_LIMIT_EXCEEDED` | Request quota exceeded (max 120/min) |
| `500` | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

---

*ASR Water & Drainage Civic-Tech API v1.0 — Documented for Production Deployment.*
