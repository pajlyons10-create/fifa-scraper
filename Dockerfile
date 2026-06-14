# Use a lightweight official Node runtime
FROM node:20-slim

# Install stable Chromium and all underlying OS graphics/font packages
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcups2 \
    && rm -rf /var/lib/apt/lists/*

# Set up the working directory inside the container
WORKDIR /app

# Copy configuration and install dependencies
COPY package*.json ./
RUN npm install

# Copy the server script
COPY . .

# Expose the network port
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]
