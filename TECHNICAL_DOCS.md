# Techurja 2K26 Admin Verification Platform — Technical Documentation

This document provides a comprehensive overview of the Admin Verification Dashboard built for the Techurja 2K26 event. The system is designed to provide secure, high-performance registration management and payment validation using a decentralized FTP storage architecture.

## 1. Architecture Overview
- **Framework**: Next.js 16 (App Router)
- **Data Source**: External FTP Server (Primary Source of Truth). Registration data and media are stored in structured directories.
- **Aesthetic**: "Arena Master" — Dark mode with neon cyan (`#00f5ff`) and magenta accents, monospace fonts, and glitch animations.

---

## 2. Core Modules & Functionality

### 2.1 Admin Dashboard (`/admin`)
The central control panel for organizers.
- **Login Gate**: Secured by `ADMIN_SECRET` environment variable with secure cookie persistence.
- **Live Feed**: Fetches real-time data by scanning the FTP `/registrations/` directory.
- **Stats Grid**: At-a-glance summary of registration states derived from folder parsing.
- **Smart Filtering**: Filter by Status, Event Name, or Search (Name, UTR, Team, ID).
- **Export**: Generate and download a comprehensive Master CSV by aggregating all `details.csv` files from the FTP.

### 2.2 Payment & ID Verification Workflow
- **Detail Modal**: Displays full team info parsed from `details.csv`.
- **Media Sourcing**: Directly fetches the payment screenshot from the specific registration folder on FTP.
- **Action Workflow**: Admins verify UTRs in screenshots against the data provided in the CSV backups.

### 2.3 Server-Side FTP Proxy
**Strict Security**: FTP credentials are NEVER exposed to the client. 
- **Fetch Logic**:
  1. Frontend requests data via secure API routes (e.g., `/api/admin/fetch-receipt/[id]`).
  2. Backend authenticates the session and connects to the FTP server using `basic-ftp`.
  3. Backend navigates to `/registrations/{id}/` to retrieve files.
  4. Media (images) are streamed back with appropriate `Content-Type`.
  5. Text data (CSV) is parsed server-side and returned as JSON.

---

## 3. Structured Logging & Monitoring
All FTP operations are logged to the server console with standard prefixes for auditing:
- `[FTP_CONNECT]`: Successful host handshake.
- `[FTP_DISCONNECT]`: Secure socket closure.
- `[FTP_FETCH_INIT]`: Verification request received.
- `[FTP_FETCH_SUCCESS]`: File successfully retrieved and processed.
- `[FTP_ERROR_XXX]`: Detailed error codes (e.g., 404 for missing files, 530 for auth failure).

---

## 4. Environment Configuration
The following environment variables are required for the system to function:
- **`ADMIN_SECRET`**: The password/token for dashboard access.
- **`FTP_HOST`**, **`FTP_PORT`**, **`FTP_USER`**, **`FTP_PASS`**: External storage credentials.

---

## 5. Development Guidelines
- **Next.js 16 Async API**: All route handlers (`[id]`) use asynchronous `params` and `searchParams` parsing.
- **Stateless Operation**: Since there is no MySQL, the dashboard is a real-time explorer of the FTP file system. 

---

## 6. Registration Storage Schema
See `FTP_DETAILS.md` for the technical breakdown of how registration data is stored on the FTP node.
