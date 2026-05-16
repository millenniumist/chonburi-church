/* THIS FILE IS GENERATED FOR PAYLOAD CMS — DO NOT EDIT MANUALLY OUTSIDE OF SCOPE */
import config from '../../payload.config'
import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './payload-admin/importMap.js'
import type { ServerFunctionClient } from 'payload'

import '@payloadcms/next/css'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  const { handleServerFunctions } = await import('@payloadcms/next/layouts')
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
