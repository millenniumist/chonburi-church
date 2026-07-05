import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
import { ContactInfo } from './globals/ContactInfo'

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
  ],
  globals: [ContactInfo],
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
  sharp,
  telemetry: false,
})
