# PRD: Techurja 2K26 Admin Verification Platform

## 1. Product Vision
To provide a secure, high-performance dashboard for Techurja organizers to verify user payments, manage registrations, and synchronize data between the MySQL database and the FTP storage nodes.

## 2. Core Functional Requirements

### 2.1 Live Registration Feed
*   **Data Sourcing**: Pull all records from the `Registration` table.
*   **Sync Mechanism**: A prominent **"REFRESH_GRID"** button that re-fetches the latest data from the database without a full page reload.
*   **Status Badges**:
    *   `PENDING`: Payment not yet checked.
    *   `VERIFIED`: Admin confirmed payment matches UTR.
    *   `REJECTED`: Invalid screenshot or fake UTR.

### 2.2 Payment Verification Interface
*   **Image Sourcing**: For each selected registration, the platform must fetch the image from the FTP directory `/registrations/{id}/`.
*   **Side-by-Side View**: Display the user's submitted Transaction ID (UTR) next to the actual uploaded screenshot for quick comparison.
*   **One-Click Verification**: A simple "APPROVE" or "REJECT" toggle that updates the database status instantly.

### 2.3 FTP Data Management
*   **CSV Preview**: Ability to view the `details.csv` stored on FTP directly in the admin browser as a backup to the DB data.
*   **Batch Export**: A button to trigger a server-side script that zips an entire category's FTP folders for offline use.

## 3. Technical Architecture

### 3.1 Backend Proxy Logic
*   The Admin platform should **not** expose FTP credentials to the browser. 
*   An API route (e.g., `/api/admin/fetch-receipt/{id}`) should act as a proxy:
    1.  Verify Admin Session.
    2.  Connect to FTP.
    3.  Stream the image back to the Admin UI.

### 3.2 Database Updates
*   Add a `status` field to the `Registration` model (default: `pending`).
*   Add an `adminNotes` field for rejection reasons (e.g., "Blurry screenshot").

## 4. User Experience (UX) - "The Arena Master" Theme
*   **Aesthetic**: Maintain the Cyberpunk/Brutalist theme (Dark background, neon status lights).
*   **Efficiency**: Enable keyboard shortcuts (e.g., `Space` to open image, `Enter` to verify).
*   **Mobile Support**: Allow admins to verify payments from their phones while on the move at the festival venue.

## 5. Security Protocols
*   **Admin Authentication**: Protect the `/admin` route with a secure password or environment-variable based secret.
*   **CSRF Protection**: Ensure all verification toggles are protected against unauthorized requests.
