import { Pool } from "pg";
import { defineConfig } from "kysely-ctl";
import { PostgresDialect } from "kysely";

export default defineConfig({
  // replace me with a real dialect instance OR a dialect name + `dialectConfig` prop.
  dialect: new PostgresDialect({
    pool: new Pool({
      host: "localhost",
      database: "dvd_credits",
    }),
  }),
  //   migrations: {
  //     migrationFolder: "migrations",
  //   },
  //   plugins: [],
  //   seeds: {
  //     seedFolder: "seeds",
  //   }
});
