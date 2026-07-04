import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Missions: CollectionConfig = {
  slug: 'missions',
  labels: {
    singular: 'Mission',
    plural: 'Missions',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'pinned', 'startDate', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'theme',
      type: 'text',
      localized: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      editor: lexicalEditor(),
    },
    {
      name: 'scripture',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'focusAreas',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'nextSteps',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroImageUrl',
      type: 'text',
      admin: {
        description: 'Hero image URL (used when no upload is attached)',
      },
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'imageUrls',
      type: 'array',
      admin: {
        description: 'Image URLs (Cloudinary)',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'endDate',
      type: 'date',
    },
  ],
}
