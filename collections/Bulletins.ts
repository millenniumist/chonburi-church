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
    },
    {
      name: 'fileUrl',
      type: 'text',
      admin: {
        description: 'Cloudinary PDF URL (used when no upload is attached)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Published',
    },
  ],
}
