import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Bulletins } from './collections/Bulletins'
import { Leaders } from './collections/Leaders'
import { Missions } from './collections/Missions'
import { PageContent } from './collections/PageContent'
import { NavigationItems } from './collections/NavigationItems'
import { FutureProjects } from './collections/FutureProjects'
import { FinancialRecords } from './collections/FinancialRecords'
import { FinancialCategories } from './collections/FinancialCategories'
import { Feedback } from './collections/Feedback'
import { PathConfigs } from './collections/PathConfigs'
import { CategorySettings } from './collections/CategorySettings'
import { ContactInfo } from './globals/ContactInfo'
import { LandingPage } from './globals/LandingPage'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'dark',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Chonburi Church Payload',
    },
  },
  routes: {
    admin: '/payload-admin',
    api: '/payload-api',
    graphQL: '/payload-graphql',
    graphQLPlayground: '/payload-graphql-playground',
  },
  collections: [
    Users,
    Media,
    Bulletins,
    Leaders,
    Missions,
    PageContent,
    NavigationItems,
    FutureProjects,
    FinancialRecords,
    FinancialCategories,
    Feedback,
    PathConfigs,
    CategorySettings,
  ],
  globals: [ContactInfo, LandingPage, SiteSettings],
  editor: lexicalEditor(),
  localization: {
    locales: ['th', 'en'],
    defaultLocale: 'th',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || 'CHANGE_ME_IN_ENV',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.PAYLOAD_DATABASE_URI ||
        process.env.DATABASE_URL_DEV ||
        process.env.DATABASE_URL,
    },
    schemaName: 'payload',
    push: true,
  }),
  plugins: [
    // Uploads land in Vercel Blob when the token is present; without it
    // (e.g. a bare local checkout) media falls back to local disk.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // disablePayloadAccessControl -> doc.url is the absolute public CDN
      // URL (copy-pasteable anywhere) instead of a proxied /payload-api path
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  sharp,
  telemetry: false,
})
