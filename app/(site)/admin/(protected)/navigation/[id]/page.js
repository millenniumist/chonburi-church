import NavigationForm from '@/components/admin/NavigationForm';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function EditNavigationPage({ params }) {
  const { id } = await params;
  const item = await prisma.navigationItem.findUnique({ where: { id } });

  if (!item) {
    notFound();
  }

  const formatted = {
    id: item.id,
    href: item.href,
    order: item.order,
    active: item.active,
    label: {
      th: item.label?.th ?? '',
      en: item.label?.en ?? '',
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit Navigation Link</h1>
        <p className="text-slate-600 mt-2">
          Update the label, order, or visibility for this menu item.
        </p>
      </div>
      <NavigationForm item={formatted} />
    </div>
  );
}
