# Start & Serve

## Before Starting

1. Download the repository.
2. Install dependencies in the application (`chat-app`) directory: `npm install`.
3. Add a `.env` file for the Docker Compose services. Place it in the root directory, next to the `docker-compose.yml` file.
4. Add an application `.env` file in the application (`chat-app`) directory.

## App Start

The app is configured to start together with the other services via Docker Compose:

`docker compose up --build`

To stop the app and shut down the containers:

`docker compose down`

## Logs

`docker logs -f simple-chat-server`
