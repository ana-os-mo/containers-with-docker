# Dockerfile Keywords Reference

This mini guide explains the most common Dockerfile keywords and what they do.

## `FROM`

Specifies the base image for your Docker image. Every Dockerfile must start with a `FROM` instruction.

```dockerfile
FROM node:24.2.0-alpine
```

* **Example:** `FROM node:24.2.0-alpine` uses the official Node.js image based on Alpine Linux (a lightweight Linux distribution)
* **Usage:** You can specify multi-stage builds by using multiple `FROM` instructions with the `AS` keyword to name stages

## `WORKDIR`

Sets the working directory for subsequent instructions. If the directory doesn't exist, Docker creates it.

```dockerfile
WORKDIR /home/app
```

* **Example:** All `RUN`, `COPY`, `CMD` commands after this will execute in `/home/app`
* **Best Practice:** Always use `WORKDIR` instead of `RUN cd /some/path`

## `COPY`

Copies files or directories from your local machine (build context) into the container.

```dockerfile
COPY ./app/package*.json ./
```

* **Example:** `COPY ./app/package*.json ./` copies `package.json` and `package-lock.json` from the `./app` directory into the current working directory in the container
* **Flags:** `--from=builder` copies files from a previous build stage in multi-stage builds; `--chown=user:group` sets ownership

## `ADD`

Similar to `COPY`, but with additional features like extracting compressed files and downloading from URLs.

```dockerfile
ADD https://example.com/file.tar.gz /tmp/
```

* **Best Practice:** Use `COPY` unless you specifically need `ADD`'s extra features
* **Use Case:** Extracting tar archives automatically

## `RUN`

Executes commands during the image build process. Creates a new layer in the image.

```dockerfile
RUN npm ci --omit=dev --ignore-scripts
```

* **Example:** `RUN npm ci` installs dependencies
* **Best Practice:** Chain commands with `&&` to reduce layers: `RUN apt-get update && apt-get install -y curl`

## `ENV`

Sets environment variables that will be available both during the build and when the container runs.

```dockerfile
ENV NODE_ENV=production
```

* **Example:** `ENV NODE_ENV=production` sets the Node.js environment to production mode
* **Usage:** Variables set with `ENV` persist in the running container

## `ARG`

Defines build-time variables that can be passed during the build process. Unlike `ENV`, these don't persist in the final image.

```dockerfile
ARG VERSION=1.0.0
```

* **Example:** `docker build --build-arg VERSION=2.0.0 .`
* **Difference from ENV:** `ARG` values are only available during build, not at runtime

## `USER`

Specifies which user will run subsequent instructions and the container itself.

```dockerfile
USER nodeapp
```

* **Example:** `USER nodeapp` runs the application as a non-root user for security
* **Best Practice:** Never run applications as root in production containers

## `EXPOSE`

Documents which ports the container listens on. This is informational, it doesn't actually publish the port.

```dockerfile
EXPOSE 3000
```

* **Example:** `EXPOSE 3000` indicates the app listens on port 3000
* **Note:** You still need to use `-p` flag when running the container to actually map the port

## `CMD`

Specifies the default command to run when the container starts. There can only be one `CMD` instruction (the last one takes effect).

```dockerfile
CMD ["node", "server.js"]
```

* **Example:** `CMD ["node", "server.js"]` runs the Node.js application
* **Format:** Use JSON array format (exec form) for best practices: `["executable", "param1", "param2"]`

## `ENTRYPOINT`

Sets the main command that will always run when the container starts. Unlike `CMD`, this cannot be overridden easily.

```dockerfile
ENTRYPOINT ["node"]
CMD ["server.js"]
```

* **Example:** When used with `CMD`, `ENTRYPOINT` defines the executable and `CMD` provides default arguments
* **Use Case:** When you want the container to run as an executable

## `LABEL`

Adds metadata to the image as key-value pairs.

```dockerfile
LABEL version="1.0.0" maintainer="[email protected]"
```

* **Example:** Used for documentation, versioning, and organization
* **Usage:** Can be inspected with `docker inspect`

## `HEALTHCHECK`

Defines a command to check if the container is healthy.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/ || exit 1
```

* **Example:** Checks if the application responds every 30 seconds
* **Usage:** Docker marks the container as unhealthy if the check fails

### Multi-Stage Build Example

```dockerfile
# Stage 1: Build dependencies
FROM node:24.2.0-alpine AS builder
WORKDIR /home/app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:24.2.0-alpine
WORKDIR /home/app
COPY --from=builder /home/app/node_modules ./node_modules
COPY . .
CMD ["node", "server.js"]
```

Multi-stage builds allow you to create smaller final images by separating the build environment from the runtime environment.
