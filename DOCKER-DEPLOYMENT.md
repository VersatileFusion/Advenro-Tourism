# Docker Deployment Guide for Tourism API

This guide explains how to deploy this application on a cPanel server using Docker.

## Prerequisites

- Access to your cPanel server via SSH
- Docker and Docker Compose installed on the server
- Git installed on the server (optional)

## Step 1: Get the code on your server

**Option A: Upload via cPanel File Manager**
1. Compress your project folder (excluding node_modules)
2. Upload the compressed file to your server using cPanel File Manager
3. Extract the files on the server

**Option B: Clone from Git (if your repo is private)**
```bash
git clone [your-repository-url]
cd [your-project-folder]
```

## Step 2: Configure environment variables

1. Edit the `docker-compose.yml` file to update:
   - `JWT_SECRET` with a secure random string
   - Any other environment variables needed for your application

## Step 3: Deploy with Docker

Make the deployment script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually run the docker-compose commands:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Step 4: Check the application status

```bash
docker-compose ps
docker-compose logs
```

## Step 5: Configure domain in cPanel

1. Log in to cPanel
2. Set up a domain or subdomain to proxy to port 3000 (where your app is running)
3. Configure SSL if needed

## Useful Docker Commands

- View logs: `docker-compose logs -f`
- Restart containers: `docker-compose restart`
- Stop containers: `docker-compose down`
- Check container status: `docker-compose ps`

## Troubleshooting

- **Port conflicts**: If port 3000 is already in use, change it in docker-compose.yml
- **MongoDB connection issues**: Check if MongoDB container is running with `docker ps`
- **Permission errors**: Ensure proper permissions for the mounted volumes 