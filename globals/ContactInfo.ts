import type { GlobalConfig } from 'payload'

export const ContactInfo: GlobalConfig = {
  slug: 'contact-info',
  label: 'Contact Info',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'address',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'mapEmbedUrl',
      type: 'text',
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'facebookLive', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'line', type: 'text' },
        { name: 'website', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        { name: 'latitude', type: 'text' },
        { name: 'longitude', type: 'text' },
      ],
    },
    {
      name: 'worshipTimes',
      type: 'array',
      fields: [
        {
          name: 'day',
          type: 'text',
          localized: true,
        },
        {
          name: 'event',
          type: 'text',
          localized: true,
        },
        {
          name: 'time',
          type: 'text',
        },
      ],
    },
  ],
}
