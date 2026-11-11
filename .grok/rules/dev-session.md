# Dev session

When the user says to kickstart the dev session, or kickstart the dev server, start both Docker and the app.

1. Start Docker Desktop when the Docker engine is not running.
2. From the project root, run `docker compose up -d`.
3. Start `npm run dev` when nothing is already serving http://localhost:3000.

Do not start a second dev server when port 3000 is already in use.

The steps are also in the README under "Dev session".
