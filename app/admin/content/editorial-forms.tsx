'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Save, Trash2 } from 'lucide-react';
import { updateEditorialSection, type EditorialKey } from '@/lib/actions/cms-editorial';
import { pick, type Locale, type Localized } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Editorial CMS forms (ADR-0004). One bilingual th/en form per editable
 * section, prefilled from the resolved DB content. Mirrors
 * `site-config-form.tsx`: `useTransition`, bilingual labels via `pick`, sonner
 * toasts, `router.refresh()` on success.
 *
 * The page hands each section a small, registry-driven descriptor (which
 * Localized fields it has, whether they are long-form, and whether it carries a
 * `steps: Localized[]` list) so this client stays generic — adding a section is
 * a page-side change, not a new component.
 */

/** A single editable bilingual field within a section. */
export type EditorialField = {
  /** Key into the section value object (e.g. 'heading', 'body'). */
  name: string;
  /** Bilingual label. */
  label: Localized;
  /** Render as a multi-line textarea (vs. a single-line input). */
  multiline?: boolean;
};

/** Everything the form needs to render and submit one section. */
export type EditorialSectionDescriptor = {
  key: EditorialKey;
  /** Bilingual section title + helper text. */
  title: Localized;
  description: Localized;
  /** The scalar Localized fields, in display order. */
  fields: EditorialField[];
  /** When set, the section also edits a `Localized[]` list under this key. */
  stepsField?: { name: string; label: Localized; itemLabel: Localized };
  /** The current (resolved, fallback-safe) value for this section. */
  initial: Record<string, unknown>;
};

const MAX_STEPS = 12;

function isLocalized(value: unknown): value is Localized {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { th?: unknown }).th === 'string' &&
    typeof (value as { en?: unknown }).en === 'string'
  );
}

function readLocalized(record: Record<string, unknown>, name: string): Localized {
  const v = record[name];
  return isLocalized(v) ? v : { th: '', en: '' };
}

function readSteps(record: Record<string, unknown>, name: string): Localized[] {
  const v = record[name];
  if (!Array.isArray(v)) return [];
  return v.filter(isLocalized);
}

function EditorialSectionForm({
  locale,
  section,
}: {
  locale: Locale;
  section: EditorialSectionDescriptor;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  // Hoist `stepsField` so its narrowing carries into nested closures (the
  // `.map` callbacks) without a non-null assertion.
  const stepsField = section.stepsField;

  // Steps are interactive (add/remove rows), so they live in component state;
  // the scalar fields are uncontrolled (read from FormData on submit).
  const [steps, setSteps] = useState<Localized[]>(() =>
    stepsField ? readSteps(section.initial, stepsField.name) : [],
  );

  function onSubmit(formData: FormData) {
    // Reassemble the section value from the bilingual form fields.
    const value: Record<string, unknown> = {};
    for (const field of section.fields) {
      value[field.name] = {
        th: String(formData.get(`${field.name}.th`) ?? ''),
        en: String(formData.get(`${field.name}.en`) ?? ''),
      } satisfies Localized;
    }
    if (stepsField) {
      // Filter out fully-empty rows so a trailing blank doesn't fail validation.
      value[stepsField.name] = steps.filter(
        (s) => s.th.trim().length > 0 || s.en.trim().length > 0,
      );
    }

    startTransition(async () => {
      const result = await updateEditorialSection(section.key, value);
      if (result.ok) {
        toast.success(tr('บันทึกเนื้อหาแล้ว', 'Content saved.'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pick(section.title.th, section.title.en, locale)}</CardTitle>
        <CardDescription>
          {pick(section.description.th, section.description.en, locale)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-6">
          <fieldset className="space-y-5" disabled={isPending}>
            {section.fields.map((field) => {
              const current = readLocalized(section.initial, field.name);
              const Control = field.multiline ? Textarea : Input;
              return (
                <div key={field.name} className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {pick(field.label.th, field.label.en, locale)}
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`${section.key}-${field.name}-th`}
                        className="text-xs text-muted-foreground"
                      >
                        {tr('ไทย', 'Thai')}
                      </Label>
                      <Control
                        id={`${section.key}-${field.name}-th`}
                        name={`${field.name}.th`}
                        defaultValue={current.th}
                        {...(field.multiline ? { rows: 3 } : {})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`${section.key}-${field.name}-en`}
                        className="text-xs text-muted-foreground"
                      >
                        {tr('อังกฤษ', 'English')}
                      </Label>
                      <Control
                        id={`${section.key}-${field.name}-en`}
                        name={`${field.name}.en`}
                        defaultValue={current.en}
                        {...(field.multiline ? { rows: 3 } : {})}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {stepsField ? (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  {pick(stepsField.label.th, stepsField.label.en, locale)}
                </Label>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="rounded-md border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {pick(stepsField.itemLabel.th, stepsField.itemLabel.en, locale)}{' '}
                          {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
                          aria-label={tr('ลบขั้นตอน', 'Remove step')}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {tr('ไทย', 'Thai')}
                          </Label>
                          <Textarea
                            rows={2}
                            value={step.th}
                            onChange={(e) =>
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === index ? { ...s, th: e.target.value } : s,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {tr('อังกฤษ', 'English')}
                          </Label>
                          <Textarea
                            rows={2}
                            value={step.en}
                            onChange={(e) =>
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === index ? { ...s, en: e.target.value } : s,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={steps.length >= MAX_STEPS}
                  onClick={() => setSteps((prev) => [...prev, { th: '', en: '' }])}
                >
                  <Plus className="size-4" />
                  {tr('เพิ่มขั้นตอน', 'Add step')}
                </Button>
              </div>
            ) : null}
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              <Save className="size-4" />
              {isPending ? tr('กำลังบันทึก…', 'Saving…') : tr('บันทึก', 'Save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EditorialForms({
  locale,
  sections,
}: {
  locale: Locale;
  sections: EditorialSectionDescriptor[];
}) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <EditorialSectionForm key={section.key} locale={locale} section={section} />
      ))}
    </div>
  );
}
