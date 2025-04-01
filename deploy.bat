@echo off
echo Setting up environment variables...
copy .env.docker .env

echo Building and starting containers...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo Containers are now running!
docker-compose ps 