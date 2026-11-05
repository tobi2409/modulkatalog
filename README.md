# Module Catalog - Fullsty Example

> [!IMPORTANT]
> **TODO: This example is a work in progress.**
>
> The utilities in `src/server/database-tools.ts` are planned to be extracted into a dedicated Fullsty library.

The module catalog is a Fullsty example project featuring a generated client and REST server. It displays degree programs and their modules, supports search, and provides a protected administration area for journal-based changes.

## Features Demonstrated

- REST route and JavaScript client generation with `proc2rest`
- PostgreSQL queries using the SQL Query Builder
- Reusable loading and saving utilities in `database-tools.ts`
- Journal-based persistence of model changes
- Admin authentication and protected endpoints
- Client layout generation

## Project Structure

```text
src/client/       Client source code
src/server/       Server source code and database bootstrap
generated/client/ Generated, deployable client
generated/server/ Generated REST server
```

Files under `generated/` are generated. Changes should generally be made in `src/`.

## Prerequisites

- Node.js and npm
- PostgreSQL
- A PostgreSQL database, named `fullsty_demo` by default

## Installation and Generation

```bash
npm install
npm run generate
cd generated/server
npm install
```

After changing files under `src/`, regenerate the project with:

```bash
npm run generate
```

Alternatively, generate the client and server separately:

```bash
npm run generate-client
npm run generate-server
```

## Database

The schema and sample data are defined in `src/server/sql/bootstrap.sql`.

```bash
createdb fullsty_demo
psql fullsty_demo < src/server/sql/bootstrap.sql
```

The generated PostgreSQL integration reads its configuration from `generated/server/pg/.env.pg`. Example:

```dotenv
DEFAULT_PGHOST=127.0.0.1
DEFAULT_PGPORT=5432
DEFAULT_PGUSER=postgres
DEFAULT_PGPASSWORD=postgres
DEFAULT_PGDATABASE=fullsty_demo
DEFAULT_POOL_MAX=10
```

Admin authentication also requires `SECRET_KEY` in `generated/server/.env`:

```dotenv
SECRET_KEY=replace-with-a-secure-secret
```

## Running the Project

Start the server:

```bash
cd generated/server
npm start
```

The server is available at `http://localhost:3000` by default. The contents of `generated/client/` can be served in parallel using any static web server.

## Development Status

This project serves as a Fullsty example and is under active development. In particular, `database-tools.ts` is currently still part of this project. The goal is to move it into a dedicated Fullsty library so that loading, searching, sorting, and journal-based persistence can be reused across other Fullsty projects.
