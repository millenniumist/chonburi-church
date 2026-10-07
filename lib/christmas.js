import { getPayloadClient } from '@/lib/payload-cms';

// The original ccxmas form; used whenever the CMS formFields array is empty.
export const DEFAULT_FORM_FIELDS = [
  { name: 'firstName', label: 'ชื่อจริง', type: 'text', required: true, width: 'half', showOnTicket: true },
  { name: 'lastName', label: 'นามสกุล', type: 'text', required: true, width: 'half', showOnTicket: true },
  { name: 'nickName', label: 'ชื่อเล่น', type: 'text', required: true, width: 'half' },
  { name: 'age', label: 'อายุ', type: 'number', required: true, width: 'half' },
  { name: 'phone', label: 'เบอร์โทรศัพท์', type: 'tel', required: true, width: 'full' },
  { name: 'notes', label: 'หมายเหตุเพิ่มเติม', type: 'textarea', required: false, width: 'full', placeholder: 'ข้อมูลเพิ่มเติมที่ต้องการแจ้งให้ทราบ' },
];

// Fallback copy for any empty field in the christmas-event global.
export const CHRISTMAS_DEFAULTS = {
  enabled: false,
  eventDate: null,
  eyebrow: 'ลงทะเบียนร่วมงาน',
  title: 'คริสต์มาสแห่งความหวัง',
  dateLabel: '24 ธันวาคม',
  timeLabel: '17:00 น.',
  venue: 'คริสตจักรชลบุรี',
  verse: '',
  verseRef: '',
  formTitle: 'แบบฟอร์มลงทะเบียน',
  submitLabel: 'ลงทะเบียนเข้าร่วมงาน',
  pdpaText:
    'ข้าพเจ้ายินยอมให้จัดเก็บข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 เพื่อใช้ในการลงทะเบียนและติดต่อสื่อสารเกี่ยวกับงานคริสต์มาสเท่านั้น',
  ticketNote: 'กรุณาแคปหน้าจอ เพื่อแสดงที่โต๊ะลงทะเบียนก่อนเข้างาน',
  formFields: DEFAULT_FORM_FIELDS,
};

const normalizeField = (f) => ({
  name: f.name,
  label: f.label || f.name,
  type: f.type || 'text',
  required: Boolean(f.required),
  width: f.width === 'half' ? 'half' : 'full',
  showOnTicket: Boolean(f.showOnTicket),
  placeholder: f.placeholder || '',
  options: (f.options || []).map((o) => o.label).filter(Boolean),
});

export async function getChristmasEvent() {
  const merged = { ...CHRISTMAS_DEFAULTS };
  try {
    const payload = await getPayloadClient();
    const doc = await payload.findGlobal({ slug: 'christmas-event' });
    for (const key of Object.keys(CHRISTMAS_DEFAULTS)) {
      const v = doc?.[key];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      merged[key] = v;
    }
  } catch {
    // CMS unreachable: fall back to defaults (page stays hidden)
  }
  merged.formFields = merged.formFields.filter((f) => f?.name).map(normalizeField);
  return merged;
}

// Validates a raw submission against the configured fields.
// Returns { answers } or { error }. Unknown keys are dropped.
export function validateAnswers(fields, raw = {}) {
  const answers = {};
  for (const f of fields) {
    let v = raw[f.name];
    if (f.type === 'checkbox') {
      v = v === true;
      if (f.required && !v) return { error: `${f.label} is required` };
    } else if (f.type === 'number') {
      v = v === '' || v === undefined || v === null ? null : Number(v);
      if (v !== null && (!Number.isFinite(v) || v < 0 || v > 1e6)) return { error: `${f.label} is invalid` };
      if (f.required && v === null) return { error: `${f.label} is required` };
    } else {
      v = typeof v === 'string' ? v.trim().slice(0, f.type === 'textarea' ? 1000 : 200) : '';
      if (f.required && !v) return { error: `${f.label} is required` };
      if (v && f.type === 'select' && !f.options.includes(v)) return { error: `${f.label} is invalid` };
      if (v && f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) return { error: `${f.label} is invalid` };
      if (!v) v = null;
    }
    answers[f.name] = v;
  }
  return { answers };
}

export function displayNameFor(fields, answers) {
  const parts = fields.filter((f) => f.showOnTicket).map((f) => answers?.[f.name]).filter(Boolean);
  if (parts.length) return parts.join(' ');
  const firstText = fields.find((f) => ['text', 'textarea'].includes(f.type) && answers?.[f.name]);
  return firstText ? String(answers[firstText.name]) : '';
}

export async function getRegistrationByTicket(tId) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'christmas-registrations',
    where: { tId: { equals: tId } },
    limit: 1,
    depth: 0,
  });
  return docs[0] || null;
}
