import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, type Localized } from '@/lib/i18n';
import { getContent } from '@/lib/cms/read';
import { type EditorialKey } from '@/lib/actions/cms-editorial';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  EditorialForms,
  type EditorialField,
  type EditorialSectionDescriptor,
} from '@/app/admin/content/editorial-forms';

export const dynamic = 'force-dynamic';

/**
 * `/admin/content` — the editorial CMS editor (ADR-0004). Lists each editable
 * section (hero, gospel, story, first visit, classes teaser, verse) as a
 * bilingual th/en form prefilled from the resolved DB content. Saving calls the
 * `updateEditorialSection` server action, which validates against the registry
 * schema and revalidates the public landing.
 *
 * The per-section field labels live here as bilingual metadata; the registry in
 * `lib/cms/sections.ts` stays the source of truth for the *shape*, this page
 * supplies the human-facing *labels* for each known field.
 */

/**
 * The editorial sections shown on this page, in display order. The action's
 * `EditorialKey` type keeps this list honest — adding a key here that isn't
 * editable (or dropping a real one) is a compile error against `FIELD_META`.
 */
const EDITORIAL_KEYS = [
  'hero',
  'gospel',
  'story',
  'firstVisit',
  'classesTeaser',
  'verse',
] as const satisfies readonly EditorialKey[];

const L = (th: string, en: string): Localized => ({ th, en });

const HEADING_FIELD: EditorialField = { name: 'heading', label: L('หัวข้อ', 'Heading') };
const BODY_FIELD: EditorialField = { name: 'body', label: L('เนื้อหา', 'Body'), multiline: true };

/** Field/label metadata per editorial key (the shape matches the registry). */
const FIELD_META: Record<
  EditorialKey,
  {
    title: Localized;
    description: Localized;
    fields: EditorialField[];
    stepsField?: EditorialSectionDescriptor['stepsField'];
  }
> = {
  hero: {
    title: L('ส่วนหัว (Hero)', 'Hero'),
    description: L('หัวข้อหลักและปุ่มเรียกร้องบนหน้าแรก', 'The headline and call-to-action buttons at the top of the landing page.'),
    fields: [
      HEADING_FIELD,
      BODY_FIELD,
      { name: 'primaryCta', label: L('ปุ่มหลัก', 'Primary button') },
      { name: 'secondaryCta', label: L('ปุ่มรอง', 'Secondary button') },
    ],
  },
  gospel: {
    title: L('ข่าวประเสริฐ', 'Good news'),
    description: L('คำอธิบายข่าวประเสริฐบนหน้าแรก', 'The good-news explainer on the landing page.'),
    fields: [HEADING_FIELD, BODY_FIELD],
  },
  story: {
    title: L('เรื่องราวของเรา', 'Our story'),
    description: L('เรื่องราวของคาเฟ่', 'The café story section.'),
    fields: [HEADING_FIELD, BODY_FIELD],
  },
  firstVisit: {
    title: L('มาครั้งแรก', 'First visit'),
    description: L('สิ่งที่คาดหวังได้เมื่อมาครั้งแรก เป็นรายการขั้นตอน', 'What to expect on a first visit — a list of steps.'),
    fields: [HEADING_FIELD],
    stepsField: {
      name: 'steps',
      label: L('ขั้นตอน', 'Steps'),
      itemLabel: L('ขั้นตอนที่', 'Step'),
    },
  },
  classesTeaser: {
    title: L('คลาสเรียน (ตัวอย่าง)', 'Classes teaser'),
    description: L('ตัวอย่างคลาสเรียนฟรีบนหน้าแรก', 'The free-classes teaser on the landing page.'),
    fields: [HEADING_FIELD, BODY_FIELD, { name: 'cta', label: L('ปุ่ม', 'Button') }],
  },
  verse: {
    title: L('พระวจนะ', 'Verse'),
    description: L('ข้อพระคัมภีร์ต้อนรับบนหน้าแรก', 'The welcoming Bible verse on the landing page.'),
    fields: [
      { name: 'text', label: L('ข้อความ', 'Text'), multiline: true },
      { name: 'reference', label: L('อ้างอิง', 'Reference') },
    ],
  },
};

export default async function AdminContentPage() {
  await requireRole('admin');
  const locale = await getLocale();

  // Resolve each section's current content (fallback-safe via the read layer).
  const resolved = await Promise.all(
    EDITORIAL_KEYS.map(async (key) => [key, await getContent(key)] as const),
  );

  const sections: EditorialSectionDescriptor[] = resolved.map(([key, value]) => {
    const meta = FIELD_META[key];
    return {
      key,
      title: meta.title,
      description: meta.description,
      fields: meta.fields,
      stepsField: meta.stepsField,
      // The resolved value is a typed section object; the form reads its
      // Localized fields generically, so a plain record view is enough.
      initial: value as Record<string, unknown>,
    };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('เนื้อหาเว็บไซต์', 'Site content', locale)}
        description={pick(
          'แก้ไขข้อความบนหน้าแรกแบบสองภาษา การบันทึกจะอัปเดตหน้าเว็บสาธารณะทันที',
          'Edit the landing-page copy in both languages. Saving updates the public site immediately.',
          locale,
        )}
      />

      <EditorialForms locale={locale} sections={sections} />
    </div>
  );
}
