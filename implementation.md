# Techurja 2K26 Registration System Documentation

## Overview
The registration system is designed to handle user data securely while keeping the database lightweight. Instead of storing large binary image data (payment screenshots) directly in the MySQL database, we utilize an external FTP server for storage.

## Data Flow

1.  **User Input**:
    *   The user fills out the registration form (either the individual `RegisterForm` or the `UniversalRegistrationTerminal`).
    *   Required fields: Name, Email, Institution, Event Selection, Transaction ID (UTR).
    *   The payment screenshot is captured as a `File` object.

2.  **Frontend Processing**:
    *   Before transmission, the frontend converts the image file into a **Base64 encoded string**.
    *   A `POST` request is sent to `/api/register` with the JSON payload.

3.  **Backend Processing (Route Handler)**:
    *   **DB Entry**: A record is created in the `Registration` table via Prisma. Initially, the `paymentScreenshot` field is set to `PENDING_FTP`.
    *   **FTP Upload**:
        *   The system initializes an FTP connection using credentials from `.env`.
        *   A folder is created on the remote server named after the **Registration ID** (`/registrations/{id}/`).
        *   The Base64 image is decoded and uploaded as a binary file.
        *   A `details.csv` file is generated on-the-fly containing all user information and uploaded to the same folder.
    *   **Confirmation**: Upon success, the database record is updated with the remote FTP path (e.g., `UPLOADED_TO_FTP: /registrations/42/screenshot.jpg`).

## FTP Directory Structure
Each registration is isolated in its own node:
```text
/registrations/
  └── {registration_id}/
      ├── {original_filename}.jpg  <-- Proof of payment
      └── details.csv              <-- User data snapshot
```

## Security & Verification
*   **Environment Variables**: All FTP credentials must be stored in the `.env` file (`FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`).
*   **Manual Confirmation**: Administrators can check the database for the `UPLOADED_TO_FTP` status and verify the transaction using the files on the FTP drive.
*   **Database Schema**: The `paymentScreenshot` field in the database acts as a status indicator rather than a data store.
