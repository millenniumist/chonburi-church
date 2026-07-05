import Link from 'next/link';
import BulletinsList from '@/components/admin/BulletinsList';

export const metadata = {
  title: 'จัดการสูจิบัตร / Manage Bulletins - Admin',
};

export default function BulletinsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการสูจิบัตร / Bulletins</h1>
          <p className="text-slate-600 mt-1">Manage church bulletins and weekly announcements</p>
        </div>
        <Link
          href="/admin/bulletins/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
        >
          + Upload New
        </Link>
      </div>

      <BulletinsList />
    </div>
  );
}
