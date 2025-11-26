FROM node:20-slim

WORKDIR /app

# Install system dependencies for Tesseract (OCR)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Copy root config
COPY package.json tsconfig.json ./

# Copy shared packages
COPY packages/shared-types ./packages/shared-types

# Copy service
COPY services/api-gateway ./services/api-gateway

# Install dependencies (from root to link workspaces)
RUN npm install

# Build shared types
RUN npm run build --workspace=packages/shared-types

# Build service
RUN npm run build --workspace=services/api-gateway

# Expose port
EXPOSE 3000

# Start service
CMD ["npm", "start", "--workspace=services/api-gateway"]
