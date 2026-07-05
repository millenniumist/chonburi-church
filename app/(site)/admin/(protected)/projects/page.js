import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProjectsList from '@/components/admin/ProjectsList';

async function getProjects() {
  return await prisma.futureProject.findMany({
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Manage future projects and fundraising campaigns</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
        >
          + New Project
        </Link>
      </div>

      <ProjectsList projects={projects} />
    </div>
  );
}
