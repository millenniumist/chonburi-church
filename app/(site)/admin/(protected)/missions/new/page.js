import MissionForm from '@/components/admin/MissionForm';

export default function NewMissionPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">New Mission</h1>
        <p className="text-slate-600 mt-1">Create a new church mission or ministry activity</p>
      </div>

      <MissionForm />
    </div>
  );
}
