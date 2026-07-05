// Site nav is managed in the Payload CMS (Navigation Items collection):
// label th/en, href, order, and the Active checkbox to show/hide a tab.
// The old /admin navigation pages still edit the legacy Prisma table, which
// the site no longer reads.
import { getPayload } from 'payload';
import config from '../payload.config';

const DEFAULT_LOCALE = 'th';

export async function getNavigationItems({ locale = DEFAULT_LOCALE, includeInactive = false } = {}) {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'navigation-items',
    locale,
    fallbackLocale: 'th',
    sort: 'order',
    limit: 100,
    ...(includeInactive ? {} : { where: { active: { equals: true } } }),
  });

  return docs.map((item) => ({
    id: item.id,
    href: item.href,
    order: item.order,
    active: item.active,
    label: item.label ?? item.href,
  }));
}
