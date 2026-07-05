import ProjectForm from '@/components/admin/ProjectForm';

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">New Project</h1>
        <p className="text-slate-600 mt-1">Create a new fundraising project</p>
      </div>

      <ProjectForm />
    </div>
  );
}
