import { redirect } from 'next/navigation';
import { verifyAdminAuth } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Admin Panel',
  description: 'Church Admin Panel'
};

export default async function AdminLayout({ children }) {
  const isAuthenticated = await verifyAdminAuth();

  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
