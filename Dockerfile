FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy project files
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "src/server/app.js"] 