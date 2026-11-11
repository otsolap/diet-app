# Dev session

Keep the dev server running while work is in progress.

At the start of a session, and after a session resumes, start the server when nothing is already serving http://localhost:3000.

1. Start Docker Desktop when the Docker engine is not running.
2. From the project root, run `docker compose up -d`.
3. Start `npm run dev` in the background.

Do not start a second dev server when port 3000 is already in use.

This also applies when the user says to kickstart the dev session or the dev server.
