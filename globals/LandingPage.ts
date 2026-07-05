import type { GlobalConfig } from 'payload'

// Every text, Bible verse, link and image on the landing page.
// Components fall back to their built-in defaults for any empty field.
export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  label: 'Landing Page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'brand', type: 'text', localized: true, admin: { description: 'Top-left header text' } },
        { name: 'title', type: 'text', localized: true },
        { name: 'tagline', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'ctaLabel', type: 'text', localized: true },
        { name: 'ctaHref', type: 'text' },
        { name: 'imageUrl', type: 'text', admin: { description: 'Background image URL (default /images/landing-hero.png)' } },
        { name: 'imageAlt', type: 'text', localized: true },
        { name: 'socialHeading', type: 'text', localized: true, admin: { description: 'Text above the Facebook/YouTube buttons' } },
      ],
    },
    {
      name: 'featured',
      type: 'group',
      fields: [
        { name: 'subtitle', type: 'text', localized: true, admin: { description: 'Small badge above the title' } },
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true, localized: true }],
        },
        { name: 'ctaLabel', type: 'text', localized: true },
        { name: 'ctaHref', type: 'text' },
        { name: 'imageUrl', type: 'text', admin: { description: 'Side image URL (default /images/landing-featured.png)' } },
        { name: 'imageAlt', type: 'text', localized: true },
      ],
    },
    {
      name: 'promo',
      type: 'group',
      admin: { description: 'The Bible-verse section' },
      fields: [
        { name: 'imageUrl', type: 'text', admin: { description: 'Background image URL (default /images/image.png)' } },
        { name: 'imageAlt', type: 'text', localized: true },
        { name: 'badge', type: 'text', localized: true, admin: { description: 'Small pill label (default พระคัมภีร์)' } },
        {
          name: 'heroVerse',
          type: 'group',
          fields: [
            { name: 'text', type: 'textarea', localized: true, admin: { description: 'One display line per row (line breaks are kept)' } },
            { name: 'reference', type: 'text', localized: true },
          ],
        },
        { name: 'gospelTitle', type: 'text', localized: true },
        {
          name: 'verses',
          type: 'array',
          admin: { description: 'The quoted verse cards' },
          fields: [
            { name: 'text', type: 'textarea', required: true, localized: true },
            { name: 'reference', type: 'text', localized: true },
          ],
        },
        {
          name: 'closingVerse',
          type: 'group',
          fields: [
            { name: 'text', type: 'textarea', localized: true },
            { name: 'reference', type: 'text', localized: true },
          ],
        },
        { name: 'ctaLabel', type: 'text', localized: true },
        { name: 'ctaHref', type: 'text' },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        {
          name: 'columns',
          type: 'array',
          fields: [
            { name: 'heading', type: 'text', required: true, localized: true },
            {
              name: 'links',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'href', type: 'text', required: true },
              ],
            },
          ],
        },
        { name: 'bigWord', type: 'text', admin: { description: 'Huge word at the bottom (default CHONBURI)' } },
        { name: 'copyright', type: 'text', localized: true },
      ],
    },
  ],
}
