import type { CollectionConfig } from 'payload'

export const FinancialRecords: CollectionConfig = {
  slug: 'financial-records',
  labels: {
    singular: 'Financial Record',
    plural: 'Financial Records',
  },
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'income', 'expenses', 'balance', 'updatedAt'],
  },
  defaultSort: '-date',
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'income',
      type: 'number',
      required: true,
      admin: {
        description: 'THB',
      },
    },
    {
      name: 'expenses',
      type: 'number',
      required: true,
      admin: {
        description: 'THB',
      },
    },
    {
      name: 'balance',
      type: 'number',
      required: true,
      admin: {
        description: 'THB',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'incomeDetails',
      type: 'json',
      admin: {
        description: 'Per-category income breakdown',
      },
    },
    {
      name: 'expenseDetails',
      type: 'json',
      admin: {
        description: 'Per-category expense breakdown',
      },
    },
  ],
}
