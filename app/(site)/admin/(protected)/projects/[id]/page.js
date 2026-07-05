import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProjectForm from '@/components/admin/ProjectForm';

async function getProject(id) {
  const project = await prisma.futureProject.findUnique({
    where: { id }
  });

  return project;
}

export default async function EditProjectPage({ params }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Edit Project</h1>
        <p className="text-slate-600 mt-1">Update project details and images</p>
      </div>

      <ProjectForm project={project} />
    </div>
  );
}
