# 🚀 Production Deployment & Hardening Guide

## Angales Beauty Supplies Multi-Branch IMS

This document outlines standard procedures for deploying and maintaining the system in real-world hosting environments.

---

### Option 1: Process Manager Deployment (PM2 / Node on Linux/VPS)

1. **Clone & Setup Environment**:
   ```bash
   git clone <repo-url> /opt/angales-ims
   cd /opt/angales-ims
   npm install --production
   npm run build
   ```

2. **Generate Production Secrets** in `.env`:
   ```bash
   node -e "const c = require('node:crypto'); console.log('JWT_SECRET=' + c.randomBytes(32).toString('hex')); console.log('ENCRYPTION_KEY=' + c.randomBytes(32).toString('hex'));"
   ```

3. **Initialize Clean Database**:
   ```bash
   npm run init:prod
   ```

4. **Launch with PM2**:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "angales-ims" -i 1 --max-memory-restart 500M
   pm2 save
   pm2 startup
   ```

---

### Option 2: Windows Server Deployment

1. Open PowerShell as Administrator.
2. Navigate to application folder:
   ```powershell
   Set-Location "C:\AngalesIMS"
   npm.cmd install
   npm.cmd run build
   npm.cmd run init:prod
   ```
3. Use **NSSM** (Non-Sucking Service Manager) or Windows Task Scheduler to register `node.exe server/index.js` as an auto-starting background Windows Service.

---

### Option 3: Docker Deployment

Create a `Dockerfile` in the root:
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm --prefix client install
RUN npm --prefix client run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
```

---

### 🛡️ Recommended Reverse Proxy & SSL (Nginx)

For production, bind Node to localhost port 5000 and proxy traffic through Nginx with Let's Encrypt SSL:

```nginx
server {
    listen 80;
    server_name inventory.angalesbeauty.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inventory.angalesbeauty.com;

    ssl_certificate /etc/letsencrypt/live/inventory.angalesbeauty.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inventory.angalesbeauty.com/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 💾 Backup & Disaster Recovery Procedures

The database file is located at `server/data/inventory.db`. Because SQLite uses WAL (Write-Ahead Logging) mode, you can safely create online live backups using the native SQLite backup command:

```bash
# Automated daily backup script
sqlite3 server/data/inventory.db ".backup 'server/data/backups/backup-$(date +%Y%m%d_%H%M%S).db'"
```
Store off-site backups on encrypted cloud storage.
