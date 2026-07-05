import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'colorTheme',
      type: 'select',
      defaultValue: 'bw',
      options: [
        { label: 'Monotone (black & white photos)', value: 'bw' },
        { label: 'Full color', value: 'lowkey' },
      ],
      admin: {
        description: 'Site-wide look: monotone applies a grayscale filter to photos',
      },
    },
  ],
}
