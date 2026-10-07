import type { GlobalConfig } from 'payload'

// Settings + copy for the /christmas page. `enabled` is the one switch
// (default off): off = /christmas, tickets and the registration API all 404.
// `formFields` defines the sign-up form itself (empty = built-in defaults).
export const ChristmasEvent: GlobalConfig = {
  slug: 'christmas-event',
  label: 'Christmas Event',
  admin: { group: 'Christmas' },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'enabled',
      label: 'Enable Christmas registration',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'On: /christmas shows the sign-up form. Off: the page, tickets and registration API are hidden (404).' },
    },
    { name: 'eventDate', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Drives the countdown and the ticket year' } },
    {
      type: 'collapsible',
      label: 'Page text',
      fields: [
        { name: 'eyebrow', type: 'text', localized: true, admin: { description: 'Small label above the title (default ลงทะเบียนร่วมงาน)' } },
        { name: 'title', type: 'text', localized: true, admin: { description: 'Default คริสต์มาสแห่งความหวัง' } },
        { name: 'dateLabel', type: 'text', localized: true, admin: { description: 'e.g. 24 ธันวาคม 2026' } },
        { name: 'timeLabel', type: 'text', localized: true, admin: { description: 'e.g. 17:00 น.' } },
        { name: 'venue', type: 'text', localized: true, admin: { description: 'Default คริสตจักรชลบุรี' } },
        { name: 'verse', type: 'textarea', localized: true, admin: { description: 'Optional Bible verse under the title' } },
        { name: 'verseRef', type: 'text', localized: true },
        { name: 'formTitle', type: 'text', localized: true, admin: { description: 'Heading above the form (default แบบฟอร์มลงทะเบียน)' } },
        { name: 'submitLabel', type: 'text', localized: true, admin: { description: 'Default ลงทะเบียนเข้าร่วมงาน' } },
        { name: 'pdpaText', type: 'textarea', localized: true, admin: { description: 'Consent checkbox text (required to submit)' } },
        { name: 'ticketNote', type: 'text', localized: true, admin: { description: 'Shown on the ticket (default กรุณาแคปหน้าจอ เพื่อแสดงที่โต๊ะลงทะเบียน)' } },
      ],
    },
    {
      name: 'formFields',
      label: 'Form fields',
      type: 'array',
      admin: {
        description: 'The sign-up form, top to bottom. Leave empty to use the default (first/last/nick name, phone, age, notes). Renaming a field "name" starts a new column in exports.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, admin: { width: '33%', description: 'Key, e.g. phone (a-z, 0-9, _)' }, validate: (v: unknown) => (typeof v === 'string' && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(v)) || 'Letters, numbers, _ only; start with a letter' },
            { name: 'label', type: 'text', required: true, localized: true, admin: { width: '33%' } },
            {
              name: 'type',
              type: 'select',
              required: true,
              defaultValue: 'text',
              admin: { width: '33%' },
              options: [
                { label: 'Text', value: 'text' },
                { label: 'Long text', value: 'textarea' },
                { label: 'Phone', value: 'tel' },
                { label: 'Email', value: 'email' },
                { label: 'Number', value: 'number' },
                { label: 'Dropdown', value: 'select' },
                { label: 'Checkbox', value: 'checkbox' },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'required', type: 'checkbox', defaultValue: false, admin: { width: '25%' } },
            { name: 'width', type: 'select', defaultValue: 'full', admin: { width: '25%' }, options: [{ label: 'Full width', value: 'full' }, { label: 'Half width', value: 'half' }] },
            { name: 'showOnTicket', type: 'checkbox', defaultValue: false, admin: { width: '25%', description: 'Printed as the guest name' } },
            { name: 'placeholder', type: 'text', localized: true, admin: { width: '25%' } },
          ],
        },
        {
          name: 'options',
          type: 'array',
          admin: { condition: (_: unknown, sibling: { type?: string }) => sibling?.type === 'select', description: 'Dropdown choices' },
          fields: [{ name: 'label', type: 'text', required: true, localized: true }],
        },
      ],
    },
  ],
}
