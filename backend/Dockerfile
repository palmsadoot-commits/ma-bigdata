# Use Node.js LTS version
FROM node:20-alpine

# Install MariaDB/MySQL client for mysqldump and restore
RUN apk add --no-cache mariadb-client

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
