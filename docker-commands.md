# Docker Commands

This document explains how to manage the application's database infrastructure manually using the Docker CLI. We cover these commands to understand the underlying mechanics —networking, ports, and environment variables— before automating the process with Docker Compose.

## Create a Docker Network

This command creates a custom user-defined bridge network.

* **Why use a custom network?** By default, containers run in strict isolation. While Docker provides a default network, it lacks **Service Discovery** (DNS resolution).
* **How it helps:** By creating a custom network (`mongo-network`), containers can communicate using their names (e.g., `mongodb`) as hostnames, similar to web addresses.
* `docker network create`: The base command to establish the networking driver.

```bash
docker network create mongo-network
```

## Start MongoDB

This command launches the MongoDB database server in a container.

* `docker run`: Creates and starts a new container.
* `-d` (Detached): Runs the container in the background, preventing database logs from occupying your terminal.
* `-p 27017:27017` (Port Mapping): **HOST:CONTAINER**. Maps port `27017` on your machine (left) to port `27017` inside the container (right), allowing external tools to connect to the database.
* `-e` (Environment Variables): Sets configuration values inside the container. These initialize the database with a root user and password. **Note:** These variables are only processed during the first startup.
* `--name mongodb`: Assigns a friendly name to the container, which becomes its hostname within the network.
* `--net mongo-network`: Connects this container to our custom network, enabling discovery by other containers.
* `mongo:7.0`: The image to use (name:tag). Downloads version 7.0 of the official MongoDB image.

```bash
docker run -d \
-p 27017:27017 \
-e MONGO_INITDB_ROOT_USERNAME=admin \
-e MONGO_INITDB_ROOT_PASSWORD=password \
--name mongodb \
--net mongo-network \
mongo:7.0
```

## Start Mongo Express

This command launches a web-based admin interface that connects to the database and provides browser access.

* `-p 8082:8081`: Maps the interface to `http://localhost:8082` in your browser.
* **Credentials Separation:**
  * `ME_CONFIG_MONGODB_ADMIN...`: Credentials for the *application* to authenticate with the *database* (must match the MongoDB container settings).
  * `ME_CONFIG_BASICAUTH...`: Credentials for accessing the Mongo Express web interface in your browser.
* `ME_CONFIG_MONGODB_SERVER`: Specifies the database hostname. The value **`mongodb`** matches the `--name` assigned to the database container. Docker's DNS resolves this to the correct IP address.
* `ME_CONFIG_MONGODB_URL`: **(Optional but recommended)** Provides the complete connection string.
  * Format: `mongodb://<container-name>:<port>`
  * Example: `mongodb://mongodb:27017`
  * **Why?** Ensures Mongo Express uses Docker network DNS (`mongodb`) instead of attempting a `localhost` connection within the container.

```bash
docker run -d \
-p 8082:8081 \
-e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
-e ME_CONFIG_MONGODB_ADMINPASSWORD=password \
-e ME_CONFIG_BASICAUTH_USERNAME=user \
-e ME_CONFIG_BASICAUTH_PASSWORD=pass \
-e ME_CONFIG_MONGODB_SERVER=mongodb \
-e ME_CONFIG_MONGODB_URL=mongodb://mongodb:27017 \
--net mongo-network \
--name mongo-express \
mongo-express:1.0.2
```

## Stop and Remove Containers

This section covers proper shutdown procedures.

**Stop vs. Remove:**

* `stop`: Gracefully terminates the running process. The container persists in a "stopped" state.
* `rm`: Deletes the container entirely. This is **required** if you plan to reuse the same name (e.g., `mongodb`) in future `docker run` commands, as Docker prevents name conflicts.
* `network rm`: Deletes the custom bridge network.

```bash
# 1. Stop the running containers
docker stop mongodb mongo-express

# 2. Remove the containers (frees up the names for reuse)
docker rm mongodb mongo-express

# 3. Remove the network
docker network rm mongo-network
```
