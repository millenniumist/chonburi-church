import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MissionForm from '@/components/admin/MissionForm';

async function getMission(id) {
  const mission = await prisma.mission.findUnique({
    where: { id }
  });

  return mission;
}

export default async function EditMissionPage({ params }) {
  const { id } = await params;
  const mission = await getMission(id);

  if (!mission) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Edit Mission</h1>
        <p className="text-slate-600 mt-1">Update mission details and images</p>
      </div>

      <MissionForm mission={mission} />
    </div>
  );
}
