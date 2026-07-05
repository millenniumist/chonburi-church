import ContactForm from '@/components/admin/ContactForm';
import { prisma } from '@/lib/prisma';

function toFormData(record) {
  const pick = (value, key) =>
    value && typeof value === 'object' ? value[key] ?? '' : '';

  const social = record?.social ?? {};

  return {
    name: {
      th: pick(record?.name, 'th'),
      en: pick(record?.name, 'en'),
    },
    phone: record?.phone ?? '',
    email: record?.email ?? '',
    address: {
      th: pick(record?.address, 'th'),
      en: pick(record?.address, 'en'),
    },
    social: {
      facebook: social.facebook ?? '',
      facebookLive: social.facebookLive ?? '',
      youtube: social.youtube ?? '',
      line: social.line ?? '',
      instagram: social.instagram ?? '',
      website: social.website ?? '',
    },
    mapEmbedUrl: record?.mapEmbedUrl ?? '',
    coordinates: {
      latitude: record?.coordinates?.latitude ?? '',
      longitude: record?.coordinates?.longitude ?? '',
    },
    worshipTimes: Array.isArray(record?.worshipTimes)
      ? record.worshipTimes.map((entry) => ({
          day: {
            th: pick(entry?.day, 'th'),
            en: pick(entry?.day, 'en'),
          },
          event: {
            th: pick(entry?.event, 'th'),
            en: pick(entry?.event, 'en'),
          },
          time: entry?.time ?? '',
        }))
      : [],
  };
}

export default async function ContactAdminPage() {
  const record = await prisma.contactInfo.findFirst();
  const initialData = toFormData(record);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contact Information</h1>
          <p className="text-slate-600 mt-2">
            Manage the public contact details shown on the site.
          </p>
        </div>
      </div>

      <ContactForm initialData={initialData} />
    </div>
  );
}
