# Diet app

Diet app is a nutrition app for searching foods and saving meals. Food data comes from [Fineli](https://fineli.fi/), the Finnish national food composition database.

The live app is at [diet-app-blond.vercel.app](https://diet-app-blond.vercel.app/).

## Roadmap

- [x] Next.js + TypeScript starter
- [x] Local Docker Postgres
- [x] Deploy to Vercel
- [ ] Authentication (invite-only / email)
- [ ] Protect routes and API endpoints
- [ ] Fineli API proxy (auth-required)
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

The app does not connect to a database yet. When it does, it will read `DATABASE_URL` from `.env`.



