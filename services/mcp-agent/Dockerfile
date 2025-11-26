FROM node:20-slim

WORKDIR /app

# Copy root config
COPY package.json tsconfig.json ./

# Copy shared packages
COPY packages/shared-types ./packages/shared-types

# Copy service
COPY services/mcp-agent ./services/mcp-agent

# Install dependencies
RUN npm install

# Build shared types
RUN npm run build --workspace=packages/shared-types

# Build service
RUN npm run build --workspace=services/mcp-agent

# Expose port
EXPOSE 3001

# Start service
CMD ["npm", "start", "--workspace=services/mcp-agent"]
