import FeedbackManager from '@/components/admin/FeedbackManager';

export const metadata = {
  title: 'จัดการความคิดเห็น / Feedback Management - Admin',
};

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการความคิดเห็น / Feedback</h1>
          <p className="text-slate-600 mt-1">Manage user comments and feedback from the contact page</p>
        </div>
      </div>

      <FeedbackManager />
    </div>
  );
}
