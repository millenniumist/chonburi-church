// Applies the Payload schema (schemaName "payload") to the database at
// PAYLOAD_DATABASE_URI. Runs during vercel-build with NODE_ENV=development so
// the postgres adapter's drizzle push reconciles the schema — the payload CLI
// can't run here (tsx CJS-requires ESM-with-TLA packages and dies on Node 20+).
// ponytail: dev-channel push, switch to generated migrations before payload goes to main
import { getPayload } from 'payload'
import config from '../payload.config.bundle.mjs'

const payload = await getPayload({ config })
payload.logger.info('payload schema push complete')
process.exit(0)
