#!/bin/bash

# Deployment preparation script for Tourism API
echo "Preparing Tourism API for deployment..."

# Create deployment directory
DEPLOY_DIR="deployment"
echo "Creating deployment directory: $DEPLOY_DIR"
mkdir -p $DEPLOY_DIR

# Copy necessary files
echo "Copying files to deployment directory..."
cp -r src $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/
cp DEPLOYMENT-GUIDE.md $DEPLOY_DIR/
cp src/config/config.env.example $DEPLOY_DIR/src/config/config.env.example

# Create .htaccess
echo "Creating .htaccess file..."
cat > $DEPLOY_DIR/.htaccess << EOL
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
EOL

# Create production environment file template
echo "Creating production environment file template..."
cat > $DEPLOY_DIR/src/config/config.env << EOL
# Server Configuration
PORT=3000
NODE_ENV=production

# External APIs
RAPIDAPI_KEY=your_rapidapi_key

# MongoDB Configuration
MONGODB_URI=mongodb://username:password@localhost:27017/tourism

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=10
COOKIE_SECRET=your_strong_cookie_secret
EOL

# Change to deployment directory
cd $DEPLOY_DIR

# Create compressed archive
echo "Creating deployment archive..."
tar -czf ../tourism-api.tar.gz .

# Go back to original directory
cd ..

echo "Deployment preparation complete!"
echo "Archive created at: tourism-api.tar.gz"
echo "Please follow the DEPLOYMENT-GUIDE.md for next steps." 