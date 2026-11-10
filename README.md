# Diet app

Diet app is a nutrition app for searching foods and saving meals. Food data comes from [Fineli](https://fineli.fi/), the Finnish national food composition database.

The live app is at [diet-app-blond.vercel.app](https://diet-app-blond.vercel.app/).

## Roadmap

- [x] Next.js + TypeScript starter
- [x] Local Docker Postgres
- [x] Deploy to Vercel
- [x] Authentication (invite-only / email)
- [x] Protect routes and API endpoints
- [x] Fineli API proxy (auth-required)
- [ ] Food search and detail pages
- [ ] Save foods / meals
- [ ] Add TanStack Query
- [ ] Polish and public launch


## Fineli API

The app will read food data from the Fineli API.

- Components: https://fineli.fi/fineli/api/v1/components
- Food search: https://fineli.fi/fineli/api/v1/foods?q=searchterm
- Food by ID: https://fineli.fi/fineli/api/v1/foods/{id}

Replace `searchterm` with the text to search for. Replace `{id}` with a Fineli food id.

The app proxies those calls. Only a signed-in user can call the proxy.

- Components: `/api/fineli/components`
- Food search: `/api/fineli/foods?q=searchterm`
- Food by ID: `/api/fineli/foods/{id}`

A call without a session returns 401. The server reuses a successful Fineli response for a week. The session is checked on every call.

These pages stay open without a session: `/`, `/about`, `/login`, `/setup`, and `/invite/{token}`. Other pages redirect to `/login`. Other API routes return 401, except sign-in, setup, accept, and sign-out.

Values are normally per 100 g. Energy is given in kJ. Divide kJ by 4.184 to get kcal.


## Prerequisites

- [Node.js](https://nodejs.org/) 20.9 or later
- npm

## Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
| --- | --- |
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



