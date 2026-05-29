'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/lib/actions/locale';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/i18n';

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === 'th' ? 'en' : 'th';

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label="Toggle language"
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
    >
      {locale === 'th' ? 'EN' : 'ไทย'}
    </Button>
  );
}
