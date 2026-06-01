FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Accept the backend API URL at build time
# Next.js bakes NEXT_PUBLIC_ vars into the bundle during build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

# Build the production bundle
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the production server
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
CMD ["npm", "start"]
