# Deployment Guide: Node.js Application on cPanel with Ubuntu

This guide provides step-by-step instructions for deploying your Tourism API Node.js application to a hosting provider that uses cPanel on Ubuntu.

## Prerequisites

- A hosting account with cPanel access that supports Node.js
- SSH access to your server (recommended)
- MongoDB installed on your server or a MongoDB Atlas account
- Domain name configured to point to your server

## Preparation Steps

### 1. Setup Application Files

Before uploading your application, make sure you:

1. Create a production environment file:
   ```
   cp src/config/config.env.example src/config/config.env
   ```
   Then edit the `config.env` file with your production values.

2. Remove unnecessary development files:
   ```bash
   # Linux/Mac
   rm -rf node_modules
   rm -rf .git
   rm -rf cypress
   rm -rf tests

   # Windows
   rd /s /q node_modules
   rd /s /q .git
   rd /s /q cypress
   rd /s /q tests
   ```

3. Create a `.htaccess` file in your project root:
   ```
   # Disable directory browsing
   Options -Indexes
   
   # Handle frontend routes
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

4. Compress your project:
   ```bash
   # Linux/Mac
   tar -czf tourism-api.tar.gz *
   
   # Windows
   # Option 1: Use 7-Zip to create a zip file
   # Option 2: Using Windows built-in compression
   PowerShell Compress-Archive -Path * -DestinationPath tourism-api.zip -Force
   ```

### 2. cPanel Setup

1. Log in to your cPanel account
2. Navigate to "Setup Node.js App"
3. Click on "Create Application"
4. Configure your application:
   - Application mode: Production
   - Node.js version: Select the latest LTS version (16.x or higher)
   - Application root: /home/username/nodejs/tourism-api
   - Application URL: https://yourdomain.com
   - Application startup file: src/server.js
   - Environment variables: Click "Run in Node.js environment" and add your environment variables

   **Important Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb://your_username:your_password@localhost:27017/tourism
   JWT_SECRET=your_strong_jwt_secret
   COOKIE_SECRET=your_strong_cookie_secret
   FRONTEND_URL=https://yourdomain.com
   RAPIDAPI_KEY=your_rapidapi_key
   ```

## Deployment Steps

### 1. Upload Your Application

**Method 1: Using File Manager in cPanel**

1. Navigate to File Manager in cPanel
2. Go to your Node.js application directory (created in the previous step)
3. Upload your compressed project file (tourism-api.tar.gz)
4. Extract the archive:
   ```
   tar -xzf tourism-api.tar.gz
   ```
5. Delete the archive:
   ```
   rm tourism-api.tar.gz
   ```

**Method 2: Using SSH and SCP (Recommended)**

1. Upload your project using SCP:
   ```
   scp tourism-api.tar.gz username@your-server:/home/username/nodejs/tourism-api/
   ```
2. SSH into your server:
   ```
   ssh username@your-server
   ```
3. Navigate to your application directory and extract:
   ```
   cd /home/username/nodejs/tourism-api/
   tar -xzf tourism-api.tar.gz
   rm tourism-api.tar.gz
   ```

### 2. Install Dependencies

1. In your application directory, install production dependencies:
   ```
   npm install --production
   ```

### 3. Configure MongoDB

**Option 1: Local MongoDB on the server**

1. Ensure MongoDB is installed on your server
2. Create a new database and user:
   ```
   mongo
   use tourism
   db.createUser({
     user: "tourism_user",
     pwd: "your_strong_password",
     roles: [{ role: "readWrite", db: "tourism" }]
   })
   exit
   ```
3. Update your MongoDB URI in the environment variables:
   ```
   MONGODB_URI=mongodb://tourism_user:your_strong_password@localhost:27017/tourism
   ```

**Option 2: MongoDB Atlas**

1. Create a MongoDB Atlas account and cluster
2. Configure network access to allow connections from your server IP
3. Create a database user
4. Get your connection string and update your environment variables

### 4. Configure Application in cPanel

1. In cPanel's Node.js Application manager, select your application
2. Ensure environment variables are correctly set (see above)
3. Set NPM Run Script to: `start:prod`
4. Configure the application port (typically 3000)
5. Enable "Run in Node.js environment"
6. If you want to use PM2 for process management:
   - Set the NPM Run Script to: `pm2-runtime start ecosystem.config.js --env production`
   - Make sure PM2 is installed globally: `npm install -g pm2`
7. Save the configuration

### 5. Start Your Application

1. Click on the "Start" button in the Node.js Application manager
2. Check the application logs to verify it started correctly:
   - In cPanel, go to "Node.js" section
   - Click on your application
   - Look for "Application Log" button or tab
   - Review logs for any errors or startup messages

### 6. Set Up Domain and Proxy

If using a main domain or subdomain:

1. Go to "Domains" in cPanel
2. Set up a domain or subdomain (e.g., api.yourdomain.com)
3. Point it to your Node.js application path

For Apache proxy configuration (if using a subdomain):

1. Create or edit `.htaccess` file in your subdomain's public_html:
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
   </IfModule>
   
   <IfModule mod_proxy.c>
     ProxyRequests Off
     ProxyPreserveHost On
     ProxyPass / http://localhost:3000/
     ProxyPassReverse / http://localhost:3000/
   </IfModule>
   ```

2. Make sure mod_proxy and mod_rewrite are enabled on the server

### 7. SSL Configuration

Setting up SSL for your API is crucial for security:

1. In cPanel, go to "SSL/TLS" section
2. Select "Manage SSL Sites"
3. Select your domain from the dropdown
4. Use "Let's Encrypt" or install your SSL certificate
5. Follow the prompts to complete SSL setup

## Maintenance and Updates

### Updating Your Application

1. Create a new version of your application
2. Stop the current application in cPanel
3. Back up your current application
4. Upload and extract the new version
5. Install dependencies
6. Start the application

### Monitoring

1. Check application logs via cPanel's Node.js Application manager
2. Set up monitoring services like UptimeRobot to monitor your API endpoints

### Troubleshooting

- If the application fails to start, check the logs for errors
- Verify MongoDB connection is working
- Ensure all required environment variables are set correctly
- Check that the port is not being used by another application

## Additional Resources

- [cPanel Node.js Documentation](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-nodejs-application/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Documentation](https://docs.mongodb.com/)

## Security Considerations

1. Ensure your JWT_SECRET and COOKIE_SECRET are strong, unique values
2. Set up a firewall to restrict access to MongoDB if hosted locally
3. Configure SSL/TLS for your domain through cPanel
4. Consider using environment variables for sensitive information rather than config files
5. Regularly update your Node.js version and dependencies 