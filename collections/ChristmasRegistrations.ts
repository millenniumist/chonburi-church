import type { CollectionConfig } from 'payload'

// Christmas event sign-ups (migrated from the standalone ccxmas app).
// The form's fields are defined in the christmas-event global, so answers are
// stored as JSON keyed by each field's `name`. Public creates go through
// /api/christmas/register (which checks the on/off toggle); the collection
// itself is staff-only.
export const ChristmasRegistrations: CollectionConfig = {
  slug: 'christmas-registrations',
  labels: {
    singular: 'Christmas Registration',
    plural: 'Christmas Registrations',
  },
  admin: {
    useAsTitle: 'displayName',
    group: 'Christmas',
    defaultColumns: ['tId', 'displayName', 'summary', 'attendance', 'createdAt'],
    listSearchableFields: ['displayName', 'summary', 'tId'],
    description: 'Export all as CSV: /api/christmas/export (while logged in)',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'tId', label: 'Ticket ID', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'displayName', type: 'text', admin: { readOnly: true, description: 'Built from the fields marked "Show on ticket"' } },
    { name: 'summary', type: 'text', admin: { readOnly: true, description: 'All answers in one line (for search)' } },
    { name: 'answers', type: 'json', admin: { description: 'Raw answers keyed by form field name' } },
    { name: 'staffNotes', type: 'textarea' },
    { name: 'eventYear', type: 'number', index: true, admin: { position: 'sidebar' } },
    { name: 'attendance', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Checked in at the door' } },
    { name: 'pdpaConsent', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', readOnly: true } },
  ],
}
