import type { CollectionConfig } from 'payload'

export const CategorySettings: CollectionConfig = {
  slug: 'category-settings',
  labels: {
    singular: 'Category Settings',
    plural: 'Category Settings',
  },
  admin: {
    useAsTitle: 'year',
    defaultColumns: ['year', 'updatedAt'],
    description: 'Per-year visibility/aggregation settings for financial categories',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'year',
      type: 'number',
      required: true,
      unique: true,
    },
    {
      name: 'settings',
      type: 'json',
    },
  ],
}
