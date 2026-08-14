# SQLite to PostgreSQL Plan

The app now has a Prisma data layer that starts with SQLite for local development.

Current local setup:

```env
DATABASE_URL="file:./dev.db"
```

Production direction:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/cemetery"
```

Migration approach:

1. Keep app code using Prisma Client.
2. Change the Prisma datasource provider from `sqlite` to `postgresql`.
3. Create a fresh PostgreSQL migration from the same models.
4. Export local SQLite data if needed.
5. Import cleaned data into PostgreSQL through Prisma seed/import scripts.
6. Point the production API to PostgreSQL.

The important part is that Vue talks to the API, not directly to Prisma. Prisma stays server-side.
