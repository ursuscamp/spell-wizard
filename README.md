# Spell Wizard

Spell Wizard is a Nuxt app for spelling practice with shared local persistence.

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the dev server:

```bash
npm run dev
```

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Container Publishing

Pushes to `main` trigger the GitHub Actions workflow in `.github/workflows/build-and-push.yml`, which builds the app into a Docker image and publishes it to Docker Hub at `<dockerhub-user>/spell-wizard`.

Set these GitHub repository secrets before using the workflow:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

The workflow publishes two tags:

- `latest` for the current `main` branch head
- `sha-<commit>` for each pushed commit

Run the published image with a persistent data mount so SQLite and TTS cache survive container restarts:

```bash
docker run -p 3000:3000 \
  -v $(pwd)/.data:/app/.data \
  -v $(pwd)/.cache:/app/.cache \
  <dockerhub-user>/spell-wizard:latest
```

## SQLite Storage

- Default data directory: `.data`
- Default database path: `.data/spelling-wizard.sqlite`
- The app creates the SQLite file and schema automatically on first server access.
- Back up `.data/spelling-wizard.sqlite` to preserve household profiles, rewards, sessions, and word progress.
- Override the data directory with `NUXT_STORAGE_DATA_DIRECTORY`.
- Enable extra storage logging with `NUXT_STORAGE_DEBUG_LOGGING=true`.

## TTS Cache

- Default cache directory: `.cache`
- Override the cache directory with `NUXT_TTS_CACHE_DIRECTORY`.
