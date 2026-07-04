import type { CollectionConfig } from 'payload'

export const Bulletins: CollectionConfig = {
  slug: 'bulletins',
  labels: {
    singular: 'Bulletin',
    plural: 'Bulletins',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'isActive', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Sunday service date',
      },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Published',
    },
  ],
}
