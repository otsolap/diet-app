import { Pool, type QueryResultRow } from "pg";

const globalPool = globalThis as unknown as { dietPool?: Pool };

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalPool.dietPool) {
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    globalPool.dietPool = new Pool({
      connectionString,
      ssl: local ? undefined : { rejectUnauthorized: true },
    });
  }

  return globalPool.dietPool;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema() {
  schemaReady ??= getPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS invites (
      id uuid PRIMARY KEY,
      email text NOT NULL,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      accepted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS invites_email_idx ON invites (email);

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

    UPDATE users
    SET is_owner = true
    WHERE id = (
      SELECT id FROM users ORDER BY created_at ASC, id ASC LIMIT 1
    )
    AND NOT EXISTS (SELECT 1 FROM users WHERE is_owner = true);

    CREATE TABLE IF NOT EXISTS fineli_food_use_class (
      code text PRIMARY KEY,
      name text NOT NULL,
      parent_code text NOT NULL,
      parent_name text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fineli_food (
      id integer PRIMARY KEY,
      name_en text NOT NULL,
      name_fi text NOT NULL,
      name_sv text NOT NULL,
      food_use_class text
    );

    CREATE TABLE IF NOT EXISTS fineli_component_value (
      food_id integer NOT NULL REFERENCES fineli_food (id) ON DELETE CASCADE,
      component text NOT NULL,
      value numeric,
      PRIMARY KEY (food_id, component)
    );

    CREATE TABLE IF NOT EXISTS fineli_release (
      release text PRIMARY KEY,
      loaded_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS fineli_unit (
      code text PRIMARY KEY,
      name text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fineli_food_unit (
      food_id integer NOT NULL REFERENCES fineli_food (id) ON DELETE CASCADE,
      code text NOT NULL REFERENCES fineli_unit (code),
      grams numeric NOT NULL,
      PRIMARY KEY (food_id, code),
      CHECK (grams > 0)
    );

    ALTER TABLE fineli_food
      ADD COLUMN IF NOT EXISTS food_use_class text;

    CREATE TABLE IF NOT EXISTS saved_ingredient (
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      food_id integer NOT NULL REFERENCES fineli_food (id) ON DELETE CASCADE,
      saved_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, food_id)
    );

    CREATE TABLE IF NOT EXISTS portion (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      food_id integer NOT NULL REFERENCES fineli_food (id) ON DELETE RESTRICT,
      name text NOT NULL,
      grams numeric NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (grams > 0)
    );

    CREATE INDEX IF NOT EXISTS portion_user_idx ON portion (user_id);

    CREATE TABLE IF NOT EXISTS meal (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS meal_user_idx ON meal (user_id);

    CREATE TABLE IF NOT EXISTS meal_item (
      id uuid PRIMARY KEY,
      meal_id uuid NOT NULL REFERENCES meal (id) ON DELETE CASCADE,
      food_id integer REFERENCES fineli_food (id) ON DELETE RESTRICT,
      portion_id uuid REFERENCES portion (id) ON DELETE RESTRICT,
      quantity integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (quantity >= 1 AND quantity <= 99),
      CHECK (
        (food_id IS NOT NULL AND portion_id IS NULL)
        OR (food_id IS NULL AND portion_id IS NOT NULL)
      )
    );

    CREATE UNIQUE INDEX IF NOT EXISTS meal_item_food_key
      ON meal_item (meal_id, food_id) WHERE food_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS meal_item_portion_key
      ON meal_item (meal_id, portion_id) WHERE portion_id IS NOT NULL;
  `).then(
    () => undefined,
    (error: unknown) => {
      schemaReady = null;
      throw error;
    },
  );

  return schemaReady;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  await ensureSchema();
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  run: (queryInTransaction: <R extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: R[] }>) => Promise<T>,
) {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await run((text, values = []) => client.query(text, values));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
