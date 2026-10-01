# ASR WATER & DRAINAGE (ASR-WD)
> **Tagline:** Report. Track. Improve.  
> **Region:** Alluri Sitharama Raju (ASR) District, Andhra Pradesh, India  
> **Version:** 1.0 Production Backend Architecture & Civic-Tech Portal

---

## 💧 1. Overview & Architecture

**ASR Water & Drainage** is a production-grade, independent civic-technology platform designed for reporting, prioritizing, tracking, and resolving drinking-water shortages and drainage infrastructure problems across the Alluri Sitharama Raju District of Andhra Pradesh.

### System Architecture Flow
```text
Frontend (Citizen / Admin Web Applications)
        │
        ▼
   REST API v1 (/api/v1/...)
        │
        ▼
Authentication & Middleware (Auth, Admin, Org, Rate Limiting, CSRF)
        │
        ▼
   Controllers (HTTP Request Handling, Input Validation, JSON Output)
        │
        ▼
    Services (Business Logic, Transactions, Duplicate Detection, CSV/Reports)
        │
        ▼
 Database Layer (PDO Prepared Statements, Models, Foreign Keys, Indexes)
        │
        ▼
MySQL 8+ Database (Normalized utf8mb4 Engine)
```

---

## 📁 2. Complete Folder Structure

```text
W&D PROJECT/
├── backend/
│   ├── public/
│   │   └── index.php              # Public Front Controller entry point
│   ├── config/
│   │   ├── database.php           # PDO Singleton with UTF8mb4 connection
│   │   ├── environment.php        # Strict .env parser & loader
│   │   └── app.php                # System constants, statuses, roles
│   ├── routes/
│   │   └── api.php                # Central regex router with rate limit & CSRF
│   ├── controllers/
│   │   ├── AuthController.php         # Register, Login, Logout, Profile, Password
│   │   ├── ComplaintController.php    # Citizen & public complaint submissions, track
│   │   ├── AdminController.php        # Dashboard metrics, assignment, status, audit
│   │   ├── LocationController.php     # Dynamic hierarchical locations (Mandals/Villages)
│   │   ├── CategoryController.php     # Water & Drainage categories
│   │   ├── OrganizationController.php # Service departments & authorized teams
│   │   ├── UserController.php         # RBAC user administration & suspension
│   │   ├── AnalyticsController.php    # Metrics, trends, geographic hotspots
│   │   ├── NotificationController.php # In-app notification delivery
│   │   └── ReportController.php       # Dynamic CSV export streaming
│   ├── models/
│   │   ├── User.php, Location.php, Category.php, Organization.php
│   │   ├── Complaint.php, ComplaintUpdate.php, Assignment.php
│   │   ├── Notification.php, AuditLog.php, Subscription.php
│   ├── services/
│   │   ├── AuthService.php            # Token generation, session management
│   │   ├── ComplaintService.php       # Transactional state transitions
│   │   ├── LocationService.php        # Recursive hierarchy query tree
│   │   ├── AnalyticsService.php       # High-performance aggregations
│   │   ├── NotificationService.php    # Multi-channel notification pipeline
│   │   ├── AIService.php              # Optional AI triage & duplicate detection
│   │   └── ReportService.php          # CSV/PDF reporting engine
│   ├── middleware/
│   │   ├── AuthMiddleware.php         # Bearer token validation
│   │   ├── AdminMiddleware.php        # Super Admin & Admin privilege checks
│   │   ├── OrganizationMiddleware.php # Organizational data tenancy checks
│   │   ├── RateLimitMiddleware.php    # Request throttling (120 req/min)
│   │   └── CsrfMiddleware.php         # CSRF validation for mutating requests
│   ├── helpers/
│   │   ├── response.php               # Standardized JSON response formatting
│   │   ├── validation.php             # Input validation rules (RFC email, coords, enums)
│   │   ├── security.php               # Bcrypt hashing, token crypto, MIME verification
│   │   └── logger.php                 # Safe operational, error, and audit logging
│   ├── uploads/
│   │   └── .htaccess                  # Prohibits script execution in uploads
│   ├── logs/
│   │   └── .gitkeep                   # System log folder
│   ├── tests/
│   │   └── BackendTest.php            # Standalone PHP test suite
│   ├── .env                           # Active environment settings
│   └── .env.example                   # Reference environment variables template
│
├── database/
│   ├── schema.sql                     # Full normalized MySQL 8+ schema
│   ├── seed.sql                       # Complete demo seed data with bcrypt passwords
│   └── migrations/
│       └── 001_initial_schema.sql     # Database migration tracking
│
├── docs/
│   └── API.md                         # Complete REST API specification
│
├── tests/
│   └── e2e_backend_test.js            # Automated 18-step integration test runner
│
├── js/
│   ├── api.js                         # Frontend REST API client SDK
│   ├── store.js                       # Reactive local store with offline sync
│   ├── data.js                        # Seed catalog: mandals, categories, organizations
│   └── i18n.js                        # English and Telugu translation dictionary
│
├── server.js                          # Zero-dependency local dev server & mock API
└── README.md
```

---

## 🛠️ 3. Step-by-Step Installation & Deployment

### Step 1: Install PHP 8.2+
Ensure PHP 8.2 or higher is installed with the following extensions:
- `pdo_mysql`
- `mbstring`
- `fileinfo`
- `openssl`
- `json`

Verify installation:
```bash
php -v
```

### Step 2: Install MySQL 8+
Install MySQL 8.0+ or MariaDB 10.5+. Ensure the MySQL daemon is running:
```bash
mysql --version
```

### Step 3: Create Database
Connect to your MySQL CLI or phpMyAdmin:
```sql
CREATE DATABASE IF NOT EXISTS asr_water_drainage 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Step 4: Import Schema & Seed Data
Import the schema and initial seed data:
```bash
mysql -u root -p asr_water_drainage < database/schema.sql
mysql -u root -p asr_water_drainage < database/seed.sql
```

### Step 5: Configure `.env`
Copy the template and verify credentials:
```bash
cp backend/.env.example backend/.env
```
Ensure your database parameters in `backend/.env` match:
```ini
APP_ENV=development
APP_URL=http://localhost:8000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=asr_water_drainage
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

### Step 6: Run Backend
Start the PHP built-in development server pointing to the `backend/public` root:
```bash
php -S localhost:8000 -t backend/public
```

*Or use the zero-dependency dev server (Node.js):*
```bash
node server.js
```
The server serves both the frontend and the `/api/v1/` REST API at `http://localhost:3000`.

### Step 7: Test API
Run the native PHP test suite:
```bash
php backend/tests/BackendTest.php
```

Run the end-to-end integration test runner:
```bash
node tests/e2e_backend_test.js
```

### Step 8: Connect Frontend
The frontend is already configured with `js/api.js`. It automatically communicates with `/api/v1/` endpoints. All pages (`report.html`, `track.html`, `admin/index.html`) interact cleanly with the backend.

### Step 9: Default Seed Credentials
The database comes seeded with the following accounts for testing:
- **Super Administrator:** `superadmin@asr.civic` / `admin123`
- **District Admin:** `admin@asr.civic` / `admin123`
- **Organization Lead (RWSS):** `rwss.lead@asr.civic` / `admin123`
- **Citizen (Demo):** `citizen@asr.civic` / `admin123`

### Step 10: Production Web Server Deployment (Apache / Nginx)

#### Apache VirtualHost Example
```apache
<VirtualHost *:80>
    ServerName asrwater.civic
    DocumentRoot "C:/path/to/W&D PROJECT/backend/public"

    <Directory "C:/path/to/W&D PROJECT/backend/public">
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.php [QSA,L]
    </Directory>
</VirtualHost>
```

#### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name asrwater.civic;
    root /var/www/asr-water-drainage/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location /uploads {
        location ~ \.php$ {
            deny all;
        }
    }
}
```

---

## 🔒 4. Security & Privacy Guarantees

1. **Prepared Statements:** 100% of SQL statements use PDO parameterized queries. No SQL string concatenation is permitted.
2. **Password Security:** Hashes are generated via PHP `password_hash()` with `PASSWORD_BCRYPT` (cost: 12) and verified using constant-time `password_verify()`.
3. **Data Minimization & Public Anonymity:** Public tracking endpoints (`/complaints/track`, `/complaints`, `/map/complaints`) sanitize citizen phone numbers, emails, and exact household GPS.
4. **Strict Role-Based Access Control (RBAC):** Roles (`super_admin`, `admin`, `organization_admin`, `citizen`) are enforced in backend middleware. Client-supplied roles are ignored.
5. **Safe File Uploads:** Uploaded photos undergo strict `finfo(FILEINFO_MIME_TYPE)` verification. Executable file types (`.php`, `.exe`, `.sh`) are rejected, and server-side randomized file names are assigned.
6. **Immutable Audit Logs:** Administrative status changes, assignments, and account updates generate records in `audit_logs` capturing user ID, IP address, timestamp, old values, and new values.

---

## 🧪 5. Verified 16-Step End-to-End Workflow

The automated test runner (`tests/e2e_backend_test.js`) executes and validates the complete mandatory civic cycle:

| Step | Action | Endpoint | Result |
|---|---|---|---|
| **1** | Citizen registers | `POST /api/v1/auth/register` | User record created, role = `citizen` |
| **2** | Citizen logs in | `POST /api/v1/auth/login` | Secure token generated |
| **3** | Citizen selects Paderu | `GET /api/v1/locations` | Mandal ID 2 retrieved |
| **4** | Citizen selects Water | `GET /api/v1/categories?type=water` | Water category retrieved |
| **5** | Citizen submits complaint | `POST /api/v1/complaints` | Record created with location & coords |
| **6** | Backend generates ID | Internal Trigger | `ASR-WD-000004` formatted and assigned |
| **7** | Admin logs in | `POST /api/v1/auth/login` | Admin token verified |
| **8** | Dashboard displays complaint | `GET /api/v1/admin/dashboard` | Counters incremented |
| **9** | Admin reviews complaint | `GET /api/v1/complaints/track` | Complaint title and details loaded |
| **10** | Admin assigns to RWSS | `POST /api/v1/admin/complaints/:id/assign` | Assignment saved, status = `assigned` |
| **11** | Status becomes In Progress | `POST /api/v1/admin/complaints/:id/status` | Timeline milestone added |
| **12** | Organization updates work | `POST /api/v1/admin/complaints/:id/status` | Field crew update logged |
| **13** | Admin marks Resolved | `POST /api/v1/admin/complaints/:id/resolve` | `resolved_at` populated |
| **14** | Citizen sees public timeline | `GET /api/v1/complaints/track` | 5 milestones displayed, privacy preserved |
| **15** | Dashboard analytics update | `GET /api/v1/admin/dashboard` | Resolved counter dynamically updated |
| **16** | Audit trail verification | `GET /api/v1/admin/audit-logs` | `RESOLVE_COMPLAINT` action verified |

---

## 💎 6. Future Monetization Architecture

The schema incorporates dedicated monetization tables prepared for private institutional usage:
- `plans` (Tiered service features, SLAs, and API access)
- `subscriptions` & `organization_subscriptions` (Private layouts, housing societies, tea estates, or commercial complexes)
- `payments` & `invoices` (Audit records for billing)

> **Civic Trust Rule:** Public citizen complaint filing remains 100% free forever. Citizen data is never sold or shared for commercial advertising.

---

## 📖 7. Full API Documentation

For the complete API documentation with sample request bodies, parameters, and error responses, see [docs/API.md](file:///c:/Users/poitd/OneDrive/Desktop/W&D%20PROJECT/docs/API.md).
