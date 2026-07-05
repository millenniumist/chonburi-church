import Link from 'next/link';
import NavigationList from '@/components/admin/NavigationList';
import { prisma } from '@/lib/prisma';

export default async function NavigationAdminPage() {
  const items = await prisma.navigationItem.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const formatted = items.map((item) => ({
    id: item.id,
    href: item.href,
    order: item.order,
    active: item.active,
    label: {
      th: item.label?.th ?? '',
      en: item.label?.en ?? '',
    },
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Navigation Links</h1>
          <p className="text-slate-600 mt-2">
            Control the menu items shown in the site header.
          </p>
        </div>
        <Link
          href="/admin/navigation/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium"
        >
          + New Link
        </Link>
      </div>

      <NavigationList items={formatted} />
    </div>
  );
}
