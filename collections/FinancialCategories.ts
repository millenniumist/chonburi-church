import type { CollectionConfig } from 'payload'

export const FinancialCategories: CollectionConfig = {
  slug: 'financial-categories',
  labels: {
    singular: 'Financial Category',
    plural: 'Financial Categories',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'type', 'visible', 'order', 'year'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      admin: {
        description: 'Stable identifier, e.g. "offering", "salary"',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Income', value: 'income' },
        { label: 'Expense', value: 'expense' },
      ],
    },
    {
      name: 'visible',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'aggregateInto',
      type: 'text',
      admin: {
        description: 'Optional category code to roll this one up into',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'year',
      type: 'number',
      admin: {
        description: 'Leave empty to apply to all years',
      },
    },
  ],
}
