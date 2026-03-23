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

## SQLite Storage

- Default database path: `.data/spelling-wizard.sqlite`
- The app creates the SQLite file and schema automatically on first server access.
- Back up `.data/spelling-wizard.sqlite` to preserve household profiles, rewards, sessions, and word progress.
- Override the default path with `NUXT_STORAGE_DATABASE_PATH`.
- Enable extra storage logging with `NUXT_STORAGE_DEBUG_LOGGING=true`.
