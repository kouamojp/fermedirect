# Use Node.js 18 (Alpine for small footprint)
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install only production dependencies
RUN npm install bcryptjs jsonwebtoken mysql2 express redis multer cors dotenv

# Bundle app source
COPY . .

# Expose the application port (default 3000)
EXPOSE 3000

# Set environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD [ "node", "server.js" ]
