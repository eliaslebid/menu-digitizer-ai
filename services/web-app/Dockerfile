FROM node:20-slim

WORKDIR /app

# Copy root config
COPY package.json tsconfig.json ./

# Copy shared packages
COPY packages/shared-types ./packages/shared-types

# Copy service
COPY services/web-app ./services/web-app

# Install dependencies
RUN npm install

# Build shared types
RUN npm run build --workspace=packages/shared-types

# Expose Vite dev port
EXPOSE 5173

# Start Vite in dev mode with host flag to accept external connections
CMD ["npm", "run", "dev", "--workspace=services/web-app", "--", "--host", "0.0.0.0"]
