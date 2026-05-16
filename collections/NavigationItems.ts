import type { CollectionConfig } from 'payload'

export const NavigationItems: CollectionConfig = {
  slug: 'navigation-items',
  labels: {
    singular: 'Navigation Item',
    plural: 'Navigation Items',
  },
  admin: {
    useAsTitle: 'href',
    defaultColumns: ['href', 'order', 'active'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'href',
      type: 'text',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
