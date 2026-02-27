# WBAT — Business Manager

Full-stack business management app: **NestJS API + React (Vite) + MariaDB**, designed for PC & tablet.

Single-domain deployment behind **Nginx Proxy Manager**:

| Path | Target |
|------|--------|
| `https://<domain>/` | React SPA |
| `https://<domain>/api/*` | NestJS REST API |

---

## Quick Start (Portainer)

### 1. Prerequisites

- Docker host with [Portainer](https://www.portainer.io/) running
- (Optional) [Nginx Proxy Manager](https://nginxproxymanager.com/) for HTTPS

### 2. Deploy Dev Stack

1. In Portainer → **Stacks** → **+ Add stack**
2. Set **Name**: `wbat`
3. Choose **Upload** and upload `portainer/stack-dev.yml`  
   *(or paste the contents into the web editor)*
4. In the **Environment variables** section, set:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `DB_ROOT_PASS` | e.g. `supersecret` |
| `DB_PASS` | e.g. `wbatpass` |
| `ATTACHMENTS_HOST_PATH` | e.g. `/opt/wbat/attachments` |

5. Click **Deploy the stack**

The app will be available at `http://<docker-host-ip>:8080`

**Default login:** `admin@local` / `admin`  
**⚠️ Change your password in Settings immediately after first login.**

---

### 3. Add HTTPS via Nginx Proxy Manager (optional but recommended)

1. In NPM → **Proxy Hosts** → **Add Proxy Host**
2. **Domain**: `wbat.yourdomain.tld`
3. **Forward Hostname/IP**: your Docker host IP  
4. **Forward Port**: `8080`
5. **Websockets Support**: ✅
6. **SSL** tab → Let's Encrypt → Force SSL ✅

---

## Project Layout

```
wbat/
├── api/                    NestJS REST API
│   ├── src/
│   │   ├── auth/           JWT auth, users
│   │   ├── companies/      Company profile
│   │   ├── customers/      Customer CRUD
│   │   ├── invoices/       Invoice CRUD + PDF generation
│   │   └── attachments/    File uploads
│   └── Dockerfile
│
├── web/                    React (Vite) SPA
│   ├── src/
│   │   ├── components/     Layout, InvoiceForm
│   │   ├── pages/          Dashboard, Invoices, Customers, Settings
│   │   ├── hooks/          useAuth context
│   │   └── services/       axios client
│   ├── nginx.conf          SPA + /api proxy config
│   └── Dockerfile
│
├── db/
│   └── init.sql            Idempotent schema + seed
│
├── gateway/
│   └── nginx.conf          Optional standalone gateway
│
└── portainer/
    ├── stack-dev.yml       Dev stack (port 8080 exposed)
    └── stack-prod.yml      Prod stack (NPM network)
```

---

## API Endpoints

All endpoints (except `/api/auth/login`) require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/auth/me` | Current user |
| `PATCH` | `/api/auth/password` | Change password |
| `GET/POST` | `/api/customers` | List / create customers |
| `GET/PATCH/DELETE` | `/api/customers/:id` | Single customer |
| `GET` | `/api/invoices/stats` | Dashboard stats |
| `GET/POST` | `/api/invoices` | List / create invoices |
| `GET/PATCH/DELETE` | `/api/invoices/:id` | Single invoice |
| `GET` | `/api/invoices/:id/pdf` | Download PDF |
| `GET/PATCH` | `/api/companies/me` | Company profile |
| `GET` | `/api/attachments` | List files |
| `POST` | `/api/attachments/upload` | Upload file |
| `DELETE` | `/api/attachments/:id` | Delete file |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db` | MariaDB host |
| `DB_PORT` | `3306` | MariaDB port |
| `DB_USER` | `wbat` | DB username |
| `DB_PASS` | `wbatpassword` | DB password |
| `DB_NAME` | `wbat` | Database name |
| `JWT_SECRET` | `wbat_secret_change_me` | **Must change in production!** |
| `JWT_EXPIRES` | `7d` | Token expiry |
| `ATTACHMENTS_PATH` | `/attachments` | Internal container path |
| `ATTACHMENTS_HOST_PATH` | `./attachments` | Host volume path |
| `PORT` | `3000` | API port |
| `CORS_ORIGIN` | `*` | Allowed origins |

---

## Features

- ✅ Multi-company ready (each user belongs to a company)
- ✅ JWT authentication
- ✅ Invoice management with line items and auto-numbering
- ✅ Invoice status workflow: draft → sent → paid / overdue / cancelled
- ✅ PDF invoice generation (PDFKit, no Chromium)
- ✅ Customer CRUD with search
- ✅ Company profile management
- ✅ File attachments
- ✅ Dashboard with revenue stats
- ✅ Dark-mode UI optimised for PC & tablet
- ✅ Idempotent DB init (safe to restart containers)

---

## License

GPL-3.0
