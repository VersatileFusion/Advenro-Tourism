# PowerShell script to prepare Tourism API for deployment
Write-Host "Preparing Tourism API for deployment..." -ForegroundColor Green

# Create deployment directory
$DEPLOY_DIR = "deployment"
Write-Host "Creating deployment directory: $DEPLOY_DIR" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $DEPLOY_DIR | Out-Null

# Copy necessary files
Write-Host "Copying files to deployment directory..." -ForegroundColor Cyan
Copy-Item -Path "src" -Destination "$DEPLOY_DIR\" -Recurse -Force
Copy-Item -Path "public" -Destination "$DEPLOY_DIR\" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$DEPLOY_DIR\" -Force
Copy-Item -Path "package-lock.json" -Destination "$DEPLOY_DIR\" -Force
Copy-Item -Path "README.md" -Destination "$DEPLOY_DIR\" -Force
Copy-Item -Path "DEPLOYMENT-GUIDE.md" -Destination "$DEPLOY_DIR\" -Force
Copy-Item -Path "ecosystem.config.js" -Destination "$DEPLOY_DIR\" -Force

# Create directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$DEPLOY_DIR\src\config" | Out-Null

# Create .htaccess
Write-Host "Creating .htaccess file..." -ForegroundColor Cyan
$htaccessContent = @"
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
"@
Set-Content -Path "$DEPLOY_DIR\.htaccess" -Value $htaccessContent

# Create production environment file template
Write-Host "Creating production environment file template..." -ForegroundColor Cyan
$envContent = @"
# Server Configuration
PORT=3000
NODE_ENV=production

# External APIs
RAPIDAPI_KEY=your_rapidapi_key

# MongoDB Configuration
MONGODB_URI=mongodb://username:password@localhost:27017/tourism

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=10
COOKIE_SECRET=your_strong_cookie_secret
"@
Set-Content -Path "$DEPLOY_DIR\src\config\config.env" -Value $envContent

# Create compressed archive
Write-Host "Creating deployment archive..." -ForegroundColor Cyan
$currentLocation = Get-Location
Set-Location -Path $DEPLOY_DIR
Compress-Archive -Path * -DestinationPath ..\tourism-api.zip -Force
Set-Location -Path $currentLocation

Write-Host "Deployment preparation complete!" -ForegroundColor Green
Write-Host "Archive created at: tourism-api.zip" -ForegroundColor Yellow
Write-Host "Please follow the DEPLOYMENT-GUIDE.md for next steps." -ForegroundColor Yellow 