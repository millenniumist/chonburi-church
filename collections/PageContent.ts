import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const PageContent: CollectionConfig = {
  slug: 'page-content',
  labels: {
    singular: 'Page Section',
    plural: 'Page Sections',
  },
  admin: {
    useAsTitle: 'section',
    defaultColumns: ['page', 'section', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'page',
      type: 'text',
      required: true,
      admin: {
        description: 'Page identifier, e.g. "about", "home"',
      },
    },
    {
      name: 'section',
      type: 'text',
      required: true,
      admin: {
        description: 'Section identifier within the page',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      editor: lexicalEditor(),
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  indexes: [
    {
      fields: ['page', 'section'],
      unique: true,
    },
  ],
}
