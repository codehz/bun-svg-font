import { Database } from "bun:sqlite";

export const db = new Database(
  "file:bun-svg-font?mode=memory&cache=shared",
  0x42
);

db.run(
  "CREATE TABLE IF NOT EXISTS definitions (key INTEGER PRIMARY KEY, name TEXT NOT NULL, value TEXT UNIQUE NOT NULL)"
);

export const insert_definition = db.prepare<{ text: string }, [string]>(
  "INSERT INTO definitions(name, value) SELECT value ->> 'name', value ->> 'value' FROM json_each(?) WHERE TRUE ON CONFLICT DO UPDATE SET value=value RETURNING char(key + 0xe000) AS text"
);
export const get_defnitions = db.prepare<
  { index: number; unicode: number; name: string; value: string },
  []
>(
  'SELECT key as "index", key + 0xe000 AS unicode, name, value FROM definitions'
);
export const reset_database = db.prepare("DELETE FROM definitions");
