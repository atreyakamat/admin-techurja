# PRD: Techurja 2K26 Admin Verification Platform

## 1. Product Vision
To provide a secure, high-performance dashboard for Techurja organizers to verify user payments, manage multi-participant registrations, and synchronize data between the MySQL database and the FTP storage nodes.

## 2. Core Functional Requirements

### 2.1 Live Registration Feed
*   **Data Sourcing**: Pull all records from the `Registration` table, including expanded team details.
*   **Team Composition**: The dashboard must display all participants (up to 4) with their respective names, emails, and phone numbers.
*   **Sync Mechanism**: A prominent **"REFRESH_GRID"** button that re-fetches the latest data from the database without a full page reload.
*   **Special Indicators**:
    *   **Accommodation**: A clear flag for Robowar teams that have requested accommodation (`needsAccommodation` field).
    *   **Team Handle**: Display the mandatory team name for all events.
*   **Status Badges**:
    *   `PENDING`: Payment not yet checked.
    *   `VERIFIED`: Admin confirmed payment matches UTR.
    *   `REJECTED`: Invalid screenshot or fake UTR.

### 2.2 Payment Verification Interface
*   **Image Sourcing**: For each selected registration, the platform must fetch the image from the FTP directory `/registrations/{id}/`.
*   **Side-by-Side View**: Display the user's submitted Transaction ID (UTR) next to the actual uploaded screenshot for quick comparison.
*   **One-Click Verification**: A simple "APPROVE" or "REJECT" toggle that updates the database status instantly.

### 2.3 Data Export & Synchronization
*   **Expanded CSV Preview**: Ability to view the `details.csv` stored on FTP directly in the admin browser, including full contact info for all members.
*   **Batch Export**: A button to trigger a server-side script that zips an entire category's FTP folders or generates a comprehensive master Excel/CSV sheet for coordinators.

## 3. Technical Architecture

### 3.1 Backend Proxy Logic
*   The Admin platform should **not** expose FTP credentials to the browser. 
*   An API route (e.g., `/api/admin/fetch-receipt/{id}`) should act as a proxy:
    1.  Verify Admin Session.
    2.  Connect to FTP.
    3.  Stream the image back to the Admin UI.

### 3.2 Database Schema (v2.0)
*   **Registration Model**:
    *   `status`: (default: `pending`)
    *   `adminNotes`: Field for rejection reasons.
    *   `needsAccommodation`: Boolean flag for Robowar logistics.
    *   `participant[1-4]`, `email[1-4]`, `phone[1-4]`: Comprehensive contact cluster.
    *   `teamName`: Mandatory for all records.

## 4. User Experience (UX) - "The Arena Master" Theme
*   **Aesthetic**: Maintain the Cyberpunk/Brutalist theme (Dark background, neon status lights).
*   **Team View**: Use expandable rows or modal clusters to display additional participant details without cluttering the main grid.
*   **Efficiency**: Enable keyboard shortcuts (e.g., `Space` to open image, `Enter` to verify).
*   **Mobile Support**: Allow admins to verify payments from their phones while on the move at the festival venue.

## 5. Security Protocols
*   **Admin Authentication**: Protect the `/admin` route with a secure password or environment-variable based secret.
*   **CSRF Protection**: Ensure all verification toggles are protected against unauthorized requests.
