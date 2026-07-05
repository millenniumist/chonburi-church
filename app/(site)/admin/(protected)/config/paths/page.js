import { prisma } from '@/lib/prisma';
import PathConfigList from '@/components/admin/PathConfigList';
import { getAvailablePaths } from './actions';

export const metadata = {
  title: 'Path Configuration | Admin',
};

export default async function PathConfigPage() {
  const [paths, availablePaths] = await Promise.all([
    prisma.pathConfig.findMany({
      orderBy: { path: 'asc' },
    }),
    getAvailablePaths()
  ]);

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold text-slate-900">Path Configuration</h1>
          <p className="text-slate-600 mt-2">
            Manage access to specific routes. Disabled paths will return a 404 or maintenance page.
          </p>
        </div>

      <PathConfigList paths={paths} availablePaths={availablePaths} />
    </div>
  );
}
