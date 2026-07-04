// Prisma's migrate advisory lock (72707369) leaks on Neon when a build dies
// mid-migrate, and every later deploy then fails P1002 after 10s. Terminate
// any session still holding it right before `prisma migrate deploy`.
// If a live concurrent build legitimately holds it, that build loses — same
// outcome as the P1002 coin-flip today, but this build wins deterministically.
import pg from 'pg'

const url = process.env.APP_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED
if (!url) {
  console.log('clear-migrate-lock: no direct database URL, skipping')
  process.exit(0)
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000 })
await client.connect()
const { rows } = await client.query(
  `SELECT pid, pg_terminate_backend(pid) AS killed
     FROM pg_locks
    WHERE locktype = 'advisory'
      AND objid = 72707369
      AND granted
      AND pid <> pg_backend_pid()`,
)
console.log(`clear-migrate-lock: terminated ${rows.length} holder(s)`, rows)
await client.end()
