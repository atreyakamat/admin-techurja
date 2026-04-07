# FTP Folder Storage Specification — Techurja 2K26

This document specifies how the registration data is stored on the remote FTP node. Each registration acts as an independent folder unit, ensuring high durability and easy data backup.

## 1. Directory Hierarchy
Registrations are located in the following root path on the FTP server:
`/registrations/`

Each registration is stored in a subfolder named after its unique Registration ID (e.g., `reg_70201`).

---

## 2. File Contents within Each Folder

### 2.1 `details.csv`
A machine-readable backup of the registration form data.
- **Format**: Standard comma-separated values (CSV).
- **Contents**: 
  - All 4 participants' names, emails, and phone numbers.
  - Team Name.
  - Institution Name.
  - Event Name and Slug.
  - Transaction ID (UTR).
  - Status and Acceptance flags.
  - Needs Accommodation flag.

### 2.2 Payment Screenshot
The image file uploaded by the user during registration.
- **Naming**: The filename can vary (e.g., `payment.png`, `screenshot_123.jpg`).
- **Discovery**: The backend identifies this file by scanning the folder for image extensions (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **Purpose**: Manual verification of the Transaction ID (UTR) by event organizers.

---

## 3. Data Integrity & Verification Workflow
1. **Source of Truth**: Since no MySQL database is utilized, the CSV backup within each folder serves as the primary source of truth.
2. **Dashboard Integration**: The Admin Dashboard scans the directory to compile the live registration feed dynamically.
3. **Audit Trail**: Any change to a registration status is directly reflected within the folder's metadata or files, ensuring the entire registration unit (data + media) is self-contained.
