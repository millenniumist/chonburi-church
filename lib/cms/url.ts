import { z } from 'zod';

/**
 * Pure, server-dep-free admin image-URL validation shared by every catalog/CMS
 * action that accepts an admin-supplied image (menu items, class offerings,
 * announcements). One source of truth so the rules can never drift between paths.
 *
 * Security: restricts to http(s) so a stored value can never be a
 * `javascript:` / `data:` / `file:` URL — these values are rendered directly into
 * public `<img src>` tags (menu, classes, the landing announcements band). Zod's
 * `.url()` alone accepts those schemes, so the explicit `^https?://` guard matters.
 *
 * Lives in a plain module (NOT a `'use server'` action file) so it is import-safe
 * from client forms and unit tests without dragging the DB driver into a bundle.
 *
 * Empty string or absent → `null` (the `imageUrl` columns are nullable).
 */
export const imageUrlSchema = z
  .union([
    z
      .string()
      .trim()
      .max(2000)
      .refine((v) => /^https?:\/\//i.test(v) && z.string().url().safeParse(v).success, {
        message: 'must be a valid http(s) URL',
      }),
    z.literal(''),
  ])
  .optional()
  .transform((v) => (v ? v : null));
