# ⚡ Techurja 2K26 — Admin Verification Platform

A secure, high-performance Laravel/PHP admin dashboard for Techurja organizers to verify user payments, manage registrations, and synchronize data between MySQL and FTP storage.

## Features

### 🔐 Admin Authentication
- Password-based login via `ADMIN_PASSWORD` environment variable
- Session-based auth — no user accounts needed
- CSRF protection on all forms and API endpoints
- Brute-force resistant with `hash_equals` comparison

### 📋 Live Registration Feed
- Real-time REFRESH_GRID button (AJAX, no page reload)
- Filter by status, event name, or free-text search
- Status badges: `PENDING` | `VERIFIED` | `REJECTED` (with neon indicators)
- Keyboard shortcuts: `↑↓` navigate, `Space` open receipt, `Enter` approve, `R` reject

### ✅ Payment Verification Interface
- Side-by-side view: UTR number vs. uploaded payment screenshot
- APPROVE / REJECT one-click toggle with optional rejection notes
- Receipt streamed securely through `/api/admin/fetch-receipt/{id}` (FTP credentials never exposed to browser)
- Reset to PENDING for re-review

### 📁 FTP Data Management
- CSV preview: view `details.csv` from FTP inline in the browser
- Batch export: ZIP an entire event category's FTP folder for offline use

### 🎨 Cyberpunk / Brutalist Theme
- Dark background with neon cyan, green, red, yellow status indicators
- Monospace font, scanline effects, neon glow on hover
- Fully responsive — works on mobile for on-the-go verification

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Framework | Laravel 10 (PHP 8.1+)              |
| Database  | MySQL                              |
| Storage   | FTP (proxied server-side)          |
| Frontend  | Blade templates + Vanilla JS       |
| Auth      | Custom session-based middleware    |
| Security  | CSRF tokens, `hash_equals` auth    |

## Installation

### Requirements
- PHP 8.1+
- Composer
- MySQL 5.7+
- PHP FTP extension (`ext-ftp`)
- PHP ZipArchive extension (`ext-zip`)

### Setup

```bash
# 1. Install dependencies
composer install

# 2. Copy environment file
cp .env.example .env

# 3. Generate application key
php artisan key:generate

# 4. Configure your database and FTP in .env
# (see .env.example for all options)

# 5. Run migrations
php artisan migrate

# 6. (Optional) Seed sample data
php artisan db:seed

# 7. Start the server
php artisan serve
```

Then visit `http://localhost:8000/admin/login` and log in with your `ADMIN_PASSWORD`.

## Environment Configuration

Key variables in `.env`:

```env
# Admin authentication (REQUIRED — change in production!)
ADMIN_PASSWORD=your_secure_password_here

# Database
DB_HOST=127.0.0.1
DB_DATABASE=techurja_admin
DB_USERNAME=root
DB_PASSWORD=

# FTP Storage
FTP_HOST=ftp.yourdomain.com
FTP_USERNAME=ftpuser
FTP_PASSWORD=ftppassword
FTP_ROOT=/registrations
```

## API Routes

All API routes require admin session authentication.

| Method | Route                            | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/api/admin/registrations`       | Live registration feed (JSON)      |
| POST   | `/api/admin/verify/{id}`         | Approve or reject a registration   |
| POST   | `/api/admin/verify/{id}/reset`   | Reset to PENDING status            |
| GET    | `/api/admin/fetch-receipt/{id}`  | Proxy receipt image from FTP       |
| GET    | `/api/admin/csv-preview/{id}`    | Preview details.csv from FTP       |
| POST   | `/api/admin/export/{category}`   | Download ZIP of category FTP folder|

## Database Schema

### `registrations` table

| Column        | Type                              | Description                    |
|---------------|-----------------------------------|--------------------------------|
| `id`          | BIGINT (PK)                       | Auto-increment ID              |
| `name`        | VARCHAR                           | Participant name                |
| `email`       | VARCHAR                           | Email address                  |
| `phone`       | VARCHAR(20)                       | Phone number                   |
| `college`     | VARCHAR (nullable)                | College/institution            |
| `event`       | VARCHAR                           | Event name                     |
| `category`    | VARCHAR (nullable)                | Event category                 |
| `utr_number`  | VARCHAR (nullable)                | Payment UTR/Transaction ID     |
| `amount`      | DECIMAL(10,2)                     | Registration fee amount        |
| `status`      | ENUM(pending, verified, rejected) | Verification status            |
| `admin_notes` | TEXT (nullable)                   | Admin rejection notes          |
| `created_at`  | TIMESTAMP                         | Registration timestamp         |
| `updated_at`  | TIMESTAMP                         | Last update timestamp          |

## FTP Directory Structure

The platform expects receipts organized as:
```
/registrations/
    {id}/
        receipt.jpg      ← payment screenshot
        details.csv      ← registration backup data
    {category}/          ← for batch export
        ...
```

## Running Tests

```bash
php artisan test
# or
./vendor/bin/phpunit
```

## Security Considerations

- FTP credentials are **never** sent to the browser
- Admin password uses constant-time comparison (`hash_equals`) to prevent timing attacks  
- CSRF tokens protect all state-changing operations
- Category names are sanitized (alphanumeric only) before FTP path construction
- Receipts served with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`
- Session is regenerated on login and invalidated on logout

## Keyboard Shortcuts

| Key       | Action                          |
|-----------|---------------------------------|
| `↑` / `↓` | Navigate registration rows      |
| `Space`   | Open receipt for selected row   |
| `Enter`   | Approve selected / confirm      |
| `R`       | Reject selected row             |
| `Esc`     | Close modal                     |
