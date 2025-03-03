# Deployment Guide

This guide explains how to deploy the Tourism Booking API to various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [CI/CD Setup](#cicd-setup)
7. [Monitoring](#monitoring)
8. [Backup Strategy](#backup-strategy)

## Prerequisites

- Node.js v14 or higher
- MongoDB v4.4 or higher
- PM2 (for process management)
- Nginx (for reverse proxy)
- SSL certificate
- Domain name

## Environment Setup

### Production Environment Variables

Create \`config.env\` in \`src/config/\`:

\`\`\`env
NODE_ENV=production
PORT=3000

# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/tourism

# JWT
JWT_SECRET=your-production-secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_EMAIL=your@email.com
SMTP_PASSWORD=your-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Tourism App

# File Upload
MAX_FILE_UPLOAD=2000000
FILE_UPLOAD_PATH=/var/www/tourism-api/public/uploads

# Two-Factor Authentication
VAPID_EMAIL=your@email.com
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# SMS
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
\`\`\`

### Directory Structure

\`\`\`
/var/www/tourism-api/
├── src/
├── public/
│   └── uploads/
├── logs/
├── node_modules/
└── ecosystem.config.js
\`\`\`

## Database Setup

### MongoDB Atlas Setup

1. Create MongoDB Atlas cluster
2. Configure network access
3. Create database user
4. Get connection string
5. Set up database indexes

\`\`\`javascript
// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.hotels.createIndex({ location: "2dsphere" });
db.reviews.createIndex({ user: 1, itemId: 1 }, { unique: true });
\`\`\`

## Production Deployment

### Server Setup

1. Update system:
\`\`\`bash
sudo apt update && sudo apt upgrade
\`\`\`

2. Install Node.js:
\`\`\`bash
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
\`\`\`

3. Install PM2:
\`\`\`bash
sudo npm install -g pm2
\`\`\`

### Application Deployment

1. Clone repository:
\`\`\`bash
git clone https://github.com/yourusername/tourism-api.git
cd tourism-api
\`\`\`

2. Install dependencies:
\`\`\`bash
npm ci --production
\`\`\`

3. Create PM2 ecosystem file:
\`\`\`javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tourism-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
\`\`\`

4. Start application:
\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
\`\`\`

### Nginx Setup

1. Install Nginx:
\`\`\`bash
sudo apt install nginx
\`\`\`

2. Configure Nginx:
\`\`\`nginx
# /etc/nginx/sites-available/tourism-api
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/tourism-api/public/uploads;
    }
}
\`\`\`

3. Enable site:
\`\`\`bash
sudo ln -s /etc/nginx/sites-available/tourism-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### SSL Setup

1. Install Certbot:
\`\`\`bash
sudo apt install certbot python3-certbot-nginx
\`\`\`

2. Get SSL certificate:
\`\`\`bash
sudo certbot --nginx -d api.yourdomain.com
\`\`\`

## Docker Deployment

### Dockerfile

\`\`\`dockerfile
FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - ./src/config/config.env
    volumes:
      - uploads:/usr/src/app/public/uploads
    depends_on:
      - mongo

  mongo:
    image: mongo:4.4
    volumes:
      - mongodb_data:/data/db

volumes:
  uploads:
  mongodb_data:
\`\`\`

## CI/CD Setup

### GitHub Actions

\`\`\`yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/tourism-api
            git pull
            npm ci --production
            pm2 reload all
\`\`\`

## Monitoring

### PM2 Monitoring

1. Setup PM2 monitoring:
\`\`\`bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
\`\`\`

2. Monitor application:
\`\`\`bash
pm2 monit
\`\`\`

### Application Logging

1. Configure Winston logging:
\`\`\`javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
\`\`\`

## Backup Strategy

### Database Backups

1. Create backup script:
\`\`\`bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/mongodb"
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$TIMESTAMP"
\`\`\`

2. Schedule daily backups:
\`\`\`bash
0 0 * * * /path/to/backup.sh
\`\`\`

### File Backups

1. Create file backup script:
\`\`\`bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/uploads"
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" /var/www/tourism-api/public/uploads
\`\`\`

2. Schedule weekly backups:
\`\`\`bash
0 0 * * 0 /path/to/file-backup.sh
\`\`\` 