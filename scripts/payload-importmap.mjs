// Regenerates app/(payload)/payload-admin/importMap.js. The payload CLI
// (generate:importmap) can't run in this repo (tsx CJS-requires ESM-with-TLA
// packages), so call the generator directly with the esbuild-bundled config.
import { generateImportMap } from 'payload'
import configPromise from '../payload.config.bundle.mjs'

const config = await configPromise
await generateImportMap(config, { log: true })
process.exit(0)
