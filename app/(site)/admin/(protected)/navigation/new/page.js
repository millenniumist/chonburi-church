import NavigationForm from '@/components/admin/NavigationForm';

export default function NewNavigationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create Navigation Link</h1>
        <p className="text-slate-600 mt-2">
          Add a new item to the site navigation menu.
        </p>
      </div>
      <NavigationForm />
    </div>
  );
}
