# Local backend development

Run these commands from this `backend` directory with Docker Desktop running.
Compose starts MariaDB only. Run the API locally with Bun.

## First setup

Copy `.env.example` to `.env` if you do not already have one:

```powershell
Copy-Item .env.example .env
```

Start the database and wait until it is ready:

```powershell
docker compose up -d --wait
```

Compose creates the database and configures the root account. Initialize the application
tables and sample data, then start the backend:

```powershell
bun install
bun run migrate
bun run seed
bun run dev
```

The API runs at http://localhost:3001/api.
For the frontend, set `VITE_API_URL=http://localhost:3001/api` in the repository
root `.env`, then start or restart `bun dev` from the repository root.

## Development credentials

| Setting | Default |
| --- | --- |
| Database host | `localhost` |
| Database port | `3306` |
| Database name | `company_portal` |
| Database user | `root` |
| Database password | `root` |

Compose reads `DB_NAME`, `DB_PASSWORD`, and `DB_PORT` from `.env`
when present. Keep `DB_USER=root` in the backend configuration.
Use these credentials only for local development. The database port is bound to
the local machine, and the backend uses the root account.

Application logins are separate and are created by `bun run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@company.com` | `admin123` |
| Editor | `editor@company.com` | `editor123` |
| User | `user@company.com` | `user123` |

## Everyday startup

Run `docker compose up -d --wait`, then `bun run dev`.
Use `docker compose up` instead if you want database logs in the foreground.
Migration and seeding are separate setup steps; they do not run on startup.
Do not routinely repeat seeding: the existing seed script can duplicate sample
articles.

`docker compose down` stops and removes the container while retaining the named
database volume. Credentials and database initialization apply only when that
volume is empty; changing `.env` does not change existing database passwords.

Image initialization reference: [official MariaDB image documentation](https://hub.docker.com/_/mariadb).
