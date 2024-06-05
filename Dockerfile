# Use bun js image
FROM oven/bun:1

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY . .
COPY package*.json ./
# Install dependencies
RUN bun install

# Copy the rest of the application code

# Build the NestJS application
RUN bun run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "start:prod"]