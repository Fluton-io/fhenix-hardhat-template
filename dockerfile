# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and pnpm-lock.yaml files to the container
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install the dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code to the container
COPY . .

# Run the script using node
CMD ["pnpm", "hardhat", "run", "relayer/relayer.ts"]