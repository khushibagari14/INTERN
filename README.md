# My First API

A minimal Node.js backend with two JSON endpoints. No external dependencies —
uses only Node's built-in `http` module.

## Endpoints

- `GET /` → `{"message": "Hello! This is my first API."}`
- `GET /status` → `{"status": "ok", "time": "<current ISO timestamp>"}`

## Run it

node server.js

Then visit http://localhost:3000/ and http://localhost:3000/status,
or run:

curl http://localhost:3000/
curl http://localhost:3000/status
