# Cemetery Information Management System

An office-focused cemetery operations system for managing cemetery grounds, plot inventory, interment records, apartment tombs, baby vaults, bone vaults, renewals, and reports.

## Technology

- Vue 3, Vite, and Vuetify
- Express API
- Prisma ORM
- SQLite for local development
- PostgreSQL-ready data model for production migration
- Leaflet and OpenStreetMap for cemetery grounds mapping

## Requirements

- Node.js 20 or later
- npm

## Local Setup

```sh
npm install
cp .env.example .env
npm run db:generate
npm run db:init-sqlite
npm run db:seed
npm run dev:full
```

The application will be available at:

- Frontend: `http://127.0.0.1:5173`
- Local API: `http://127.0.0.1:8055`

## Local Login

For the seeded local environment:

```text
Email: admin@example.com
Password: admin
```

The current local authentication adapter accepts any non-empty password for the seeded user. Production authentication must use a password hash and secure session handling.

## Demo Status Data

To preview all plot statuses with synthetic interment records:

```sh
npm run db:seed-demo
```

For each plot type, the demo seed assigns:

- Unit `001`: Occupied with a linked interment
- Unit `002`: Reserved
- Unit `003`: Maintenance
- Unit `004`: Unavailable
- Remaining units: Available

The demo seed is repeatable and uses clearly identified synthetic records.

## Development Commands

```sh
npm run dev          # Frontend only
npm run api          # Express API only
npm run dev:full     # Frontend and API
npm run build        # Type-check and production build
npm run db:studio    # Prisma Studio
```

## Database Notes

The SQLite database file and local environment file are intentionally excluded from Git. See [`docs/sqlite-to-postgres.md`](docs/sqlite-to-postgres.md) for the production migration path and [`docs/operations-schema-workflow.md`](docs/operations-schema-workflow.md) for the operations data model.
