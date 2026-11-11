# Diet app

Diet app is a nutrition app for searching foods and saving meals. Food data comes from [Fineli](https://fineli.fi/), the Finnish national food composition database.

The live app is at [diet-app-blond.vercel.app](https://diet-app-blond.vercel.app/).

## Roadmap

- [x] Next.js + TypeScript starter
- [x] Local Docker Postgres
- [x] Deploy to Vercel
- [x] Authentication (invite-only / email)
- [x] Protect private pages
- [x] Fineli food data in Postgres
- [x] Food search and detail pages
- [ ] Save ingredients
- [ ] Create meals from one or more ingredients
- [ ] Food diary for breakfast, lunch, dinner, and supper, with total calories and macros
- [ ] Week plan
- [ ] Add TanStack Query
- [ ] Polish and public launch

## Food data

The app stores Fineli basic package 1 in Postgres. Git does not store the package.

Download basic package 1 from the [Fineli open data page](https://fineli.fi/fineli/en/avoin-data). Open that page in a browser. Choose "Basic package 1". The browser downloads a zip. The current package is release 20.

Save the zip here, and leave it zipped:

`data/fineli/Fineli_Rel20.zip`

Rename the file if the browser used another name. Git ignores it.

Load the local database once:

```bash
npm run fineli:import
```

The command reads `DATABASE_URL` from `.env`. It unzips the package in a temporary folder, loads Postgres, and deletes that folder. When a new package arrives, save it with the same file name and run the command again.

To load the production database, copy `DATABASE_URL` from the Vercel project settings. Run the same command with that URL. Do not save the production URL in the project.

```bash
DATABASE_URL='paste-the-production-url' npm run fineli:import
```

Search is at `/foods`. One food is at `/foods/{id}`. Both pages are public. Values are per 100 g. The package stores energy in kJ. The pages show kcal as kJ divided by 4.184.

Food data: Finnish Institute for Health and Welfare, [Fineli](https://fineli.fi/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Access

These pages stay open without a session: `/`, `/about`, `/login`, `/setup`, `/foods`, `/foods/{id}`, and `/invite/{token}`. Other pages redirect to `/login`.


## Prerequisites

- [Node.js](https://nodejs.org/) 20.9 or later
- npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Copy `.env.example` to `.env` before the first start. Replace each `change-me` value. Docker Compose reads the Postgres settings from `.env`.

## Dev session

A dev session starts Docker and the Next.js dev server.

Open Docker Desktop first. Postgres does not start while Docker Desktop is closed.

From this folder:

```bash
npm install
docker compose up -d
npm run dev
```

`docker compose up -d` starts Postgres. The container name is `diet-app-postgres`. It listens on `127.0.0.1` and the port in `POSTGRES_PORT`. The default port is `5432`.

`npm run dev` starts the app at [http://localhost:3000](http://localhost:3000).

Stop Postgres with:

```bash
docker compose stop
```

| Command | What it does |
| --- | --- |
| `docker compose up -d` | Start Postgres |
| `docker compose stop` | Stop Postgres |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |

The app reads `DATABASE_URL` from `.env`.

## Accounts

Sign-in is invite-only. People choose an email and a password. The app does not send email.

Set `AUTH_SECRET` to a long random value. Set `AUTH_BOOTSTRAP_EMAIL` to the owner email. Add both on Vercel for Production and Preview.

Open `/setup` once and create the owner password. Only that owner can open `/invite` and create a link for another email. An invite link works for 7 days.

The app creates its tables on the first visit.

## License

The application code is [MIT](LICENSE). Copyright (c) 2026 [Otso Lappalainen](https://varangianventure.com/).

The Fineli food data is not part of that license. Food data: Finnish Institute for Health and Welfare, [Fineli](https://fineli.fi/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).



