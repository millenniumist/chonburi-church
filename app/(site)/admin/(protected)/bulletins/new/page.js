import BulletinForm from '@/components/admin/BulletinForm';

export const metadata = {
  title: 'อัพโหลดสูจิบัตรใหม่ / Upload New Bulletin - Admin',
};

export default function NewBulletinPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          อัพโหลดสูจิบัตรใหม่
        </h1>
        <p className="text-gray-600 mt-2">
          Upload New Church Bulletin
        </p>
      </div>

      <BulletinForm />
    </div>
  );
}
