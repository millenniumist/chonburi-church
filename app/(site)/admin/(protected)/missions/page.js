import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import MissionsList from '@/components/admin/MissionsList';

async function getMissions() {
  return await prisma.mission.findMany({
    orderBy: [
      { pinned: 'desc' },
      { updatedAt: 'desc' }
    ]
  });
}

export default async function AdminMissionsPage() {
  const missions = await getMissions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Missions</h1>
          <p className="text-slate-600 mt-1">Manage church missions and ministry activities</p>
        </div>
        <Link
          href="/admin/missions/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
        >
          + New Mission
        </Link>
      </div>

      <MissionsList missions={missions} />
    </div>
  );
}
