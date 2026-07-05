// Seeds the LOCAL payload DB with th-locale content pulled from the deployed
// dev-branch CMS, so local smoke tests run against realistic data. Wipe-and-
// recreate per collection. en locales are skipped (fallback serves th).
//
// Env: REMOTE (base url), BYPASS (x-vercel-protection-bypass), REMOTE_EMAIL/
// REMOTE_PASSWORD (for auth-only collections), PAYLOAD_DATABASE_URI +
// PAYLOAD_SECRET (local target).
import { getPayload } from 'payload'
import config from '../payload.config.bundle.mjs'

const REMOTE = process.env.REMOTE
const BYPASS = process.env.BYPASS
if (!REMOTE) {
  console.error('set REMOTE=https://…')
  process.exit(1)
}

const headers = { 'x-vercel-protection-bypass': BYPASS ?? '' }
if (process.env.REMOTE_EMAIL) {
  const res = await fetch(`${REMOTE}/payload-api/users/login`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.REMOTE_EMAIL, password: process.env.REMOTE_PASSWORD }),
  })
  const { token } = await res.json()
  if (token) headers.Authorization = `JWT ${token}`
}

const stripIds = (v) => {
  if (Array.isArray(v)) return v.map(stripIds)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) {
      if (k === 'id' || k === 'createdAt' || k === 'updatedAt') continue
      out[k] = stripIds(val)
    }
    return out
  }
  return v
}

const payload = await getPayload({ config })

const COLLECTIONS = [
  'navigation-items',
  'missions',
  'bulletins',
  'leaders',
  'page-content',
  'future-projects',
  'financial-records',
  'financial-categories',
  'path-configs',
  'category-settings',
  'feedback',
]

for (const slug of COLLECTIONS) {
  try {
    const res = await fetch(`${REMOTE}/payload-api/${slug}?limit=200&locale=th`, { headers })
    if (!res.ok) {
      console.log(`${slug}: remote ${res.status}, skipped`)
      continue
    }
    const { docs } = await res.json()
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
    let n = 0
    for (const doc of docs) {
      const data = stripIds(doc)
      delete data.file
      delete data.heroImage
      delete data.image
      try {
        await payload.create({ collection: slug, locale: 'th', data })
        n++
      } catch (err) {
        console.log(`  ${slug} doc skipped: ${err.message?.slice(0, 100)}`)
      }
    }
    console.log(`${slug}: ${n}/${docs.length}`)
  } catch (err) {
    console.log(`${slug}: ERROR ${err.message?.slice(0, 120)}`)
  }
}

try {
  const res = await fetch(`${REMOTE}/payload-api/globals/contact-info?locale=th`, { headers })
  if (res.ok) {
    const doc = stripIds(await res.json())
    await payload.updateGlobal({ slug: 'contact-info', locale: 'th', data: doc })
    console.log('contact-info: 1')
  }
} catch (err) {
  console.log(`contact-info: ERROR ${err.message?.slice(0, 120)}`)
}

process.exit(0)
