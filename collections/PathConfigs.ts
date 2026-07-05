import type { CollectionConfig } from 'payload'

export const PathConfigs: CollectionConfig = {
  slug: 'path-configs',
  labels: {
    singular: 'Path Config',
    plural: 'Path Configs',
  },
  admin: {
    useAsTitle: 'path',
    defaultColumns: ['path', 'isEnabled', 'updatedAt'],
    description: 'Disable a path to hide its nav tab AND 404 the page (middleware)',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Route path, e.g. /missions',
      },
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
