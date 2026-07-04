import type { CollectionConfig } from 'payload'

export const FutureProjects: CollectionConfig = {
  slug: 'future-projects',
  labels: {
    singular: 'Future Project',
    plural: 'Future Projects',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'targetAmount', 'currentAmount', 'priority', 'isActive'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'priority',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'targetAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'THB',
      },
    },
    {
      name: 'currentAmount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'THB',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'images',
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
  ],
}
