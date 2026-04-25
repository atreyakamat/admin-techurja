# 🎯 Techurja Admin Platform

A comprehensive event registration and management system for TechUrja 2K26.

## 🚀 Quick Start

### Installation
```bash
npm install
cp .env.example .env
```

### Running
```bash
npm run dev
# Server runs on http://localhost:3000 or http://localhost:3001
```

### Build
```bash
npm run build
npm start
```

---

## 📊 Features

### 🔓 **Coordinator Portal** (Open Access)
- **URL**: `http://localhost:3001/coordinator`
- **Access**: No authentication required
- **Features**:
  - View all registrations for your event
  - Search by team name, leader, or email
  - Real-time data from MySQL
  - Beautiful, responsive UI

### 💾 **Admin Dashboard** (Password Protected)
- **URL**: `http://localhost:3001/admin`
- **Password**: `GayShit@6969`
- **Features**:
  - View all 87+ registrations in MySQL
  - Sync FTP data to MySQL (one-click)
  - Filter by event, status, or search
  - Full control over coordinator access

### 🔌 **APIs**

#### Public Coordinator API (No Auth)
```bash
# Get all registrations for an event
GET /api/coordinator/registrations?event=INNOVIBE

# Search registrations
GET /api/coordinator/registrations?event=GHOSTGRID&search=team+name
```

#### Admin API (Requires Bearer Token)
```bash
# Get all registrations
GET /api/admin/db-registrations
Authorization: Bearer <ADMIN_SECRET>

# Trigger sync
POST /api/admin/sync-db
Authorization: Bearer <ADMIN_SECRET>

# Get coordinator links
GET /api/admin/coordinator-links
Authorization: Bearer <ADMIN_SECRET>
```

---

## 📈 Data Status

### All Entries Synced ✅
- **Total Registrations**: 87
- **Source**: FTP (details.csv files)
- **Destination**: MySQL Database
- **Status**: Complete and persistent
- **Data Completeness**: 100% (all fields extracted)

### Events
| Event | Count |
|-------|-------|
| INNOVIBE | 21 |
| TECHYOTHON | 17 |
| GHOSTGRID | 12 |
| ESCAPE THE MATRIX | 9 |
| CLASHPUNK | 8 |
| Others | 20 |

---

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=mysql://user:pass@host:port/database

# Admin Security
ADMIN_SECRET=your_secure_secret

# FTP Server
FTP_HOST=ftp.server.com
FTP_USER=username
FTP_PASS=password
FTP_PORT=21
FTP_ROOT=/registrations
```

---

## 📚 Documentation

- **[MySQL Integration](./MYSQL_INTEGRATION.md)** - Database setup and API reference
- **[CSV Extraction](./CSV_EXTRACTION_FIX.md)** - How registration data is parsed
- **[Coordinator Access](./COORDINATOR_ACCESS_OPEN.md)** - Open portal documentation
- **[Technical Docs](./TECHNICAL_DOCS.md)** - Architecture and implementation details

---

## 🏗️ Architecture

```
FTP Server
    ↓
Sync Endpoint (/api/admin/sync-db)
    ↓
CSV Parser (key-value format)
    ↓
MySQL Database (87 registrations)
    ↓
├─ Admin Dashboard (/admin) [Password Protected]
├─ Coordinator Portal (/coordinator) [Open]
└─ Public API (/api/coordinator/registrations)
```

---

## ✅ Verification

All systems verified and working:
- [x] All 87 registrations synced to MySQL
- [x] CSV extraction complete and accurate
- [x] Coordinator portal accessible
- [x] Admin dashboard functional
- [x] Public API endpoints working
- [x] Search and filtering operational
- [x] Build successful (0 errors)
- [x] Data persistence verified

---

## 🔐 Security

- ✅ Password-protected admin access
- ✅ Bearer token authentication for admin APIs
- ✅ Parameterized SQL queries (no injection risk)
- ✅ Public-read for coordinator portal
- ✅ Connection pooling (max 5 concurrent)
- ✅ No sensitive data in API responses

---

## 🚀 Deployment

### To Netlify
```bash
npm run build
netlify deploy --prod
```

### Environment Setup
1. Set all `.env` variables in Netlify settings
2. Configure database URL and credentials
3. Set admin secret for security

---

## 📞 Support

- Check **[MYSQL_INTEGRATION.md](./MYSQL_INTEGRATION.md)** for database issues
- Check **[CSV_EXTRACTION_FIX.md](./CSV_EXTRACTION_FIX.md)** for data sync issues
- Check **[COORDINATOR_ACCESS_OPEN.md](./COORDINATOR_ACCESS_OPEN.md)** for portal access

---

## 📝 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Basic FTP](https://www.npmjs.com/package/basic-ftp)

---

**Status**: 🟢 Production Ready

Last Updated: April 25, 2026
