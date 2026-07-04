import type { CollectionConfig } from 'payload'

export const Leaders: CollectionConfig = {
  slug: 'leaders',
  labels: {
    singular: 'Church Leader',
    plural: 'Church Leaders',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'position', 'order'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'position',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Image URL (used when no upload is attached)',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
