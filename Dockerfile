# ==============================================================================
# STAGE 1: Builder Stage
# ==============================================================================
# This stage installs the application dependencies in an isolated environment.
# Using a multi-stage build allows us to keep the final image smaller by only
# including the necessary runtime files, not the build tools.

# Use the official Node.js 24.2.0 image based on Alpine Linux as the base image.
# Alpine is a minimal Linux distribution, making the image lightweight (~5MB base).
# The "AS builder" names this stage so we can reference it later.
FROM node:24.2.0-alpine AS builder

# Set the working directory inside the container to /home/app.
# All subsequent commands (COPY, RUN, etc.) will execute in this directory.
# If the directory doesn't exist, Docker creates it automatically.
WORKDIR /home/app

# Copy package.json and package-lock.json from the ./app directory on the host
# to the current working directory (/home/app) in the container.
# We copy these files separately before copying the rest of the code to take
# advantage of Docker's layer caching. If package files haven't changed,
# Docker can reuse the cached layer with installed dependencies.
COPY ./app/package*.json ./

# Install the production dependencies using npm ci (clean install).
# Flags explained:
# - npm ci: Installs dependencies from package-lock.json (faster and more reliable than npm install)
# - --omit=dev: Skips devDependencies (like testing libraries) to reduce size
# - --ignore-scripts: Skips pre/post install scripts for security and speed
# This creates a node_modules directory with all required packages.
RUN npm ci --omit=dev --ignore-scripts

# ==============================================================================
# STAGE 2: Production Stage
# ==============================================================================
# This stage creates the final, minimal image that will actually run in production.
# It copies only the necessary files from the builder stage and the source code.

# Start a new stage with a fresh Node.js Alpine image.
# This image does not contain the build artifacts from the previous stage,
# resulting in a smaller final image.
FROM node:24.2.0-alpine

# Create a system group named "nodeapp" with GID 1001.
# Then create a system user named "nodeapp" with UID 1001 in that group.
# Using a non-root user improves security by limiting what the container can do.
# The && operator chains commands together in a single RUN instruction,
# which creates only one image layer instead of two.
RUN addgroup --system --gid 1001 nodeapp && \
    adduser --system --uid 1001 --ingroup nodeapp nodeapp

# Set the working directory to /home/app.
# This is where our application code and dependencies will live.
WORKDIR /home/app

# Copy the node_modules directory from the builder stage to this stage.
# Flags explained:
# - --from=builder: Copy from the "builder" stage instead of the host machine
# - --chown=nodeapp:nodeapp: Set the owner and group to nodeapp (our non-root user)
# This avoids having to run npm install again, saving time and keeping the final image smaller.
COPY --from=builder --chown=nodeapp:nodeapp /home/app/node_modules ./node_modules

# Copy the server.js file from the host's ./app directory to the container's
# working directory (/home/app). Set ownership to nodeapp for security.
COPY --chown=nodeapp:nodeapp ./app/server.js ./

# Copy the entire src directory (containing frontend files) from the host's
# ./app/src to the container's /home/app/src directory.
# Set ownership to nodeapp.
COPY --chown=nodeapp:nodeapp ./app/src ./src

# Set the NODE_ENV environment variable to "production".
# This tells Node.js and many npm packages to optimize for production:
# - Disables verbose error messages
# - Enables performance optimizations
# - Changes behavior of some libraries
ENV NODE_ENV=production

# Switch to the nodeapp user for all subsequent commands.
# From this point on, the container runs as a non-root user, which is a
# security best practice. If the application is compromised, the attacker
# has limited privileges on the system.
USER nodeapp

# Document that the application listens on port 3000.
# This is informational only and doesn't actually publish the port.
# You still need to use -p 3000:3000 when running the container to map the port.
EXPOSE 3000

# Define the command to run when the container starts.
# This uses the exec form (JSON array), which is recommended because it:
# - Runs the command directly without a shell wrapper
# - Ensures proper signal handling (SIGTERM, SIGINT)
# - Makes the Node.js process PID 1, which is important for graceful shutdowns
# The command starts the Node.js application by running server.js.
CMD ["node", "server.js"]
