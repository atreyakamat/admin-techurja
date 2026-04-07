# Technical Doc: FTP Retrieval & Admin Display Logic

This document details the "Reverse Logic" required to fetch, proxy, and display registration data (specifically payment screenshots) stored on the FTP node within the Admin Portal.

## 1. The Storage Blueprint (The "Forward" Logic)
To reverse the process, we must align with the existing storage structure:
*   **Path**: `registrations/{registrationId}/`
*   **Files**:
    *   `details.csv`: Full registration backup.
    *   `image/{filename}`: The payment screenshot (dynamic filename).

## 2. The Retrieval Flow (The "Reverse" Logic)

### Phase A: Discovery & Handshake
Since the exact filename of the screenshot is dynamic (e.g., `screenshot_1740.jpg` or `user_upload.png`), the system cannot "guess" the path.
1.  **Connect**: Establish a `basic-ftp` client connection using `FTP_HOST`, `FTP_USER`, and `FTP_PASSWORD`.
2.  **Navigate**: Move to the directory: `registrations/{registrationId}/image/`.
3.  **List**: Execute `client.list()` to retrieve the file metadata.
4.  **Identify**: Select the first file found (typically there is only one).

### Phase B: The Server-Side Proxy (`/api/admin/ftp/fetch`)
To keep FTP credentials secure and bypass CORS/Auth issues, the frontend never talks to FTP. It talks to a Next.js Route Handler.
1.  **Request**: Frontend calls `GET /api/admin/ftp/fetch?id={regId}`.
2.  **Auth**: Backend verifies the `ADMIN_SECRET` or session.
3.  **Pipe**:
    *   Backend creates a `PassThrough` stream or buffer.
    *   Downloads the file from FTP: `client.downloadTo(writableStream, remotePath)`.
    *   Sets `Content-Type: image/jpeg` (or detected type).
    *   Streams the data back to the admin's browser.

## 3. Display Logic (The "Table View")

### Data Sourcing
The Admin Table is populated by **Prisma (MySQL)**, not FTP. 
*   **Source of Truth**: `Registration` table.
*   **Field Mapping**:
    *   `ID`: Used to trigger the FTP fetch.
    *   `paymentScreenshot`: Stores the status (e.g., "UPLOADED_TO_FTP").
    *   `transactionId`: Displayed next to the image for manual comparison.

### Verification UI Component
1.  **Thumbnail/Icon**: The table shows a "View Receipt" button.
2.  **Modal Trigger**: Clicking the button opens a modal.
3.  **Image Source**: The `<img>` tag's `src` is set to the proxy URL:
    `<img src="/api/admin/ftp/fetch?id=REG_12345" alt="Payment Receipt" />`

## 4. Operational Logging (Audit Trail)
Every fetch operation must follow the structured logging format:
*   `[FTP_FETCH_INIT]`: Initiating retrieval for `{regId}`.
*   `[FTP_FETCH_SUCCESS]`: File piped successfully ({size} bytes).
*   `[FTP_ERROR_550]`: Directory not found (implies registration exists in DB but FTP upload failed).

---
**Status**: Ready for implementation in `src/app/api/admin/ftp/fetch/route.ts`.
