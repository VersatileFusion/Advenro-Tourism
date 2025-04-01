#!/bin/bash

# Simple deployment script for cPanel server

# Update environment variables for production
echo "Setting up environment variables..."
cp .env.docker .env

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/your_jwt_secret_here/$JWT_SECRET/g" .env

echo "Building and starting containers..."
# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Show status
echo "Containers are now running!"
docker-compose ps 