# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package list and lockfiles
COPY package*.json ./

# Install packages
RUN npm install

# Copy application code
COPY . .

# Expose the dashboard port
EXPOSE 3000

# Run in development dev-server mode for immediate diagnostic logging
CMD ["npm", "run", "dev"]
