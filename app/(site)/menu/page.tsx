import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/schema';
import type { MenuItem } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MenuOrdering } from '@/components/menu/menu-ordering';
import type { OrderableGroup, OrderableItem } from '@/components/menu/menu-ordering';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, { th: string; en: string }> = {
  coffee: { th: 'กาแฟ', en: 'Coffee' },
  tea: { th: 'ชา', en: 'Tea' },
  pastry: { th: 'ขนม', en: 'Pastry' },
  other: { th: 'อื่น ๆ', en: 'Other' },
};

function categoryLabel(category: string, locale: Locale): string {
  const label = CATEGORY_LABELS[category];
  if (label) return pick(label.th, label.en, locale);
  // Unknown category: title-case the raw slug as a reasonable fallback.
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default async function MenuPage() {
  const [locale, user, items] = await Promise.all([
    getLocale(),
    getCurrentUser(),
    db.select().from(menuItems).where(eq(menuItems.available, true)).orderBy(asc(menuItems.sortOrder)),
  ]);

  const canOrder = user?.orderingEnabled === true;

  // Group available items by category, preserving sortOrder within each group.
  const groups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = groups.get(item.category);
    if (list) list.push(item);
    else groups.set(item.category, [item]);
  }

  const heading = pick('เมนูกาแฟ', 'Our Menu', locale);
  const subheading = pick(
    'กาแฟทุกแก้วฟรี — เป็นของขวัญจากเรา',
    'Every cup is free — it’s our gift to you.',
    locale,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{subheading}</p>
      </header>

      {!user ? (
        <LoggedOutBanner locale={locale} />
      ) : !canOrder ? (
        <LockedBanner locale={locale} />
      ) : null}

      {items.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          {pick('ยังไม่มีเมนูในขณะนี้', 'No menu items yet.', locale)}
        </p>
      ) : canOrder ? (
        <MenuOrdering groups={toOrderableGroups(groups, locale)} locale={locale} />
      ) : (
        <div className="mt-8 space-y-10">
          {[...groups.entries()].map(([category, list]) => (
            <section key={category}>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                {categoryLabel(category, locale)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((item) => (
                  <StaticMenuCard key={item.id} item={item} locale={locale} loggedIn={!!user} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function toOrderableGroups(groups: Map<string, MenuItem[]>, locale: Locale): OrderableGroup[] {
  return [...groups.entries()].map(([category, list]) => ({
    category,
    label: categoryLabel(category, locale),
    items: list.map(
      (item): OrderableItem => ({
        id: item.id,
        nameTh: item.nameTh,
        nameEn: item.nameEn,
        descriptionTh: item.descriptionTh,
        descriptionEn: item.descriptionEn,
        imageUrl: item.imageUrl,
      }),
    ),
  }));
}

function StaticMenuCard({
  item,
  locale,
  loggedIn,
}: {
  item: MenuItem;
  locale: Locale;
  loggedIn: boolean;
}) {
  const name = pick(item.nameTh, item.nameEn, locale);
  const description = pick(item.descriptionTh ?? '', item.descriptionEn ?? '', locale);

  return (
    <Card className="overflow-hidden pt-0">
      {/* Menu images are admin-supplied arbitrary URLs; a plain <img> avoids
          remotePatterns config and keeps the Pi's image optimizer idle. Falls
          back to a shared placeholder when no image is set. */}
      <img
        src={item.imageUrl ?? '/images/menu-placeholder.webp'}
        alt={name}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <CardHeader className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant="secondary">{pick('ฟรี', 'Free', locale)}</Badge>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {loggedIn
            ? pick(
                'เข้าร่วมนมัสการหนึ่งครั้งเพื่อปลดล็อกการสั่งออนไลน์',
                'Attend one service to unlock online ordering.',
                locale,
              )
            : pick('เข้าสู่ระบบเพื่อสั่ง', 'Log in to order', locale)}
        </p>
      </CardContent>
    </Card>
  );
}

function LoggedOutBanner({ locale }: { locale: Locale }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-xl border bg-muted/40 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="font-medium">{pick('อยากสั่งกาแฟไหม?', 'Want to order?', locale)}</p>
        <p className="text-sm text-muted-foreground">
          {pick(
            'เข้าสู่ระบบเพื่อสั่งกาแฟล่วงหน้าและมารับที่เคาน์เตอร์',
            'Log in to order ahead and pick up at the counter.',
            locale,
          )}
        </p>
      </div>
      <Button asChild>
        <Link href="/login">{pick('เข้าสู่ระบบ', 'Log in', locale)}</Link>
      </Button>
    </div>
  );
}

function LockedBanner({ locale }: { locale: Locale }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-xl border bg-muted/40 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="font-medium">
          {pick('ปลดล็อกการสั่งออนไลน์', 'Unlock online ordering', locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {pick(
            'มาร่วมนมัสการกับเราหนึ่งครั้งเพื่อเริ่มสั่งกาแฟออนไลน์ได้',
            'Attend one service to unlock online ordering.',
            locale,
          )}
        </p>
      </div>
      <Button asChild>
        <Link href="/checkin">{pick('เช็คอิน', 'Check in', locale)}</Link>
      </Button>
    </div>
  );
}
