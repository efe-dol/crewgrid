# Use Node.js 20 as the base image
FROM node:20-alpine

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Build-time arguments for Next.js prerendering
ARG NEXT_PUBLIC_SUPABASE_URL=https://mock.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --ignore-scripts

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
