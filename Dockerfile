# Use the official Bun image
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Expose port (7860 for HuggingFace Spaces, 3000 for others)
EXPOSE 7860
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]

