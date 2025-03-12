# Deployment Guide

## Maintainer Contact
- Name: Erfan Ahmadvand
- Email: erwork11@gmail.com
- Phone: +989109924707

## Prerequisites

### System Requirements
- Node.js v14 or higher
- MongoDB v4.4 or higher
- Redis v6 or higher
- PM2 (for process management)
- Nginx (for reverse proxy)
- SSL certificate
- Domain name

### Cloud Services
- MongoDB Atlas or self-hosted MongoDB
- Redis Cloud or self-hosted Redis
- AWS S3 or similar for file storage
- Stripe account for payments
- SendGrid or similar for emails
- Twilio for SMS (optional)

## Environment Setup

### 1. Install Required Software

```bash
# Update system packages
sudo apt update
sudo apt upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install Redis
sudo apt install redis-server

# Install MongoDB (if self-hosting)
sudo apt install mongodb
```

### 2. Configure Environment Variables

Create a `.env` file in the production environment:

```env
# Application
NODE_ENV=production
PORT=3000
DOMAIN=https://api.tourismapi.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tourism
REDIS_URL=redis://username:password@redis.host:6379

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_aws_region

# Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your@email.com
```

## Database Setup

### MongoDB Setup

1. Create MongoDB Atlas cluster or configure local MongoDB:
```bash
# For local MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

2. Create database user:
```javascript
use tourism
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["dbOwner"]
})
```

3. Enable authentication:
```bash
sudo nano /etc/mongod.conf

# Add/modify these lines:
security:
  authorization: enabled
```

### Redis Setup

1. Configure Redis:
```bash
sudo nano /etc/redis/redis.conf

# Set password
requirepass your_secure_password

# Configure maxmemory
maxmemory 2gb
maxmemory-policy allkeys-lru
```

2. Restart Redis:
```bash
sudo systemctl restart redis
```

## Application Deployment

### 1. Clone and Build

```bash
# Clone repository
git clone https://github.com/yourusername/tourism-booking.git
cd tourism-booking

# Install dependencies
npm install --production

# Build application
npm run build
```

### 2. PM2 Setup

Create `ecosystem.config.js`:
```javascript
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
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 3. Nginx Configuration

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/tourism-api
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.tourismapi.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SSL configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.tourismapi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tourismapi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self';" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/tourism-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate

Install Certbot and get SSL certificate:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.tourismapi.com
```

## Monitoring Setup

### 1. PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Enable PM2 monitoring
pm2 monitor
```

### 2. Application Monitoring

```bash
# Install monitoring tools
npm install -g clinic doctor clinic bubbleprof clinic flame

# Run monitoring
clinic doctor -- node src/server.js
```

## Backup Setup

### 1. Database Backup

Create backup script:
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
MONGODB_URI="your_mongodb_uri"

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongo_$TIMESTAMP"

# Compress backup
tar -zcvf "$BACKUP_DIR/mongo_$TIMESTAMP.tar.gz" "$BACKUP_DIR/mongo_$TIMESTAMP"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/mongo_$TIMESTAMP"

# Remove backups older than 7 days
find "$BACKUP_DIR" -type f -name "mongo_*.tar.gz" -mtime +7 -exec rm {} \;
```

Add to crontab:
```bash
0 0 * * * /path/to/backup.sh
```

## Security Measures

### 1. Firewall Setup

```bash
# Install UFW
sudo apt install ufw

# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Security Updates

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Scaling Considerations

### 1. Horizontal Scaling
- Use load balancer (e.g., HAProxy)
- Configure session sharing with Redis
- Set up read replicas for MongoDB

### 2. Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies

## Troubleshooting

### Common Issues

1. **Application won't start:**
```bash
# Check logs
pm2 logs

# Check system resources
htop
```

2. **Database connection issues:**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

3. **Redis connection issues:**
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

### Performance Issues

1. **High CPU Usage:**
```bash
# Profile Node.js application
clinic doctor -- node src/server.js
```

2. **Memory Leaks:**
```bash
# Memory profiling
clinic heapprofile -- node src/server.js
```

## Maintenance

### Regular Tasks

1. **Log Rotation:**
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/tourism-api

/var/log/tourism-api/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 node node
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

2. **Database Maintenance:**
```bash
# MongoDB maintenance
mongosh
db.runCommand( { compact: "collection_name" } )
db.runCommand( { repairDatabase: 1 } )
```

3. **Backup Verification:**
```bash
# Test backup restoration
mongorestore --uri="mongodb://localhost:27017" --drop backup_directory
```

## Rollback Procedures

### 1. Code Rollback
```bash
# Switch to previous version
git checkout previous_tag
npm install
npm run build
pm2 restart all
```

### 2. Database Rollback
```bash
# Restore from backup
mongorestore --uri="your_mongodb_uri" --drop backup_directory
```

## Health Checks

### 1. Application Health
```bash
# Create health check endpoint
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-03-12T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```

### 2. Monitoring Endpoints
```bash
# Monitor system metrics
GET /api/metrics

Response:
{
  "uptime": 1234567,
  "memory": {
    "used": "500MB",
    "total": "1GB"
  },
  "cpu": "25%",
  "requests": {
    "total": 1000000,
    "active": 50
  }
}
``` 