import type { CollectionConfig } from 'payload'

export const Feedback: CollectionConfig = {
  slug: 'feedback',
  labels: {
    singular: 'Feedback',
    plural: 'Feedback',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'status', 'createdAt'],
    description: 'Messages submitted through the contact form',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'NEW',
      options: [
        { label: 'New', value: 'NEW' },
        { label: 'Read', value: 'READ' },
        { label: 'Archived', value: 'ARCHIVED' },
      ],
    },
  ],
}
