/**
 * Seed baseline data: site config, the Sunday service window, the three free
 * Saturday classes, a starter menu, and an admin user.
 *
 * Run with: npm run db:seed
 * Idempotent-ish: uses onConflictDoNothing where a natural key exists.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  // Import after env is loaded so the db client sees DATABASE_URL.
  const { db } = await import('@/lib/db');
  const { hashPassword } = await import('@/lib/auth/password');
  const schema = await import('@/lib/db/schema');
  const { church } = await import('@/content/site');

  // ── Site config (single row, id = 1). Default to a placeholder location;
  //    set the real church coordinates in the admin once it's built.
  await db
    .insert(schema.siteConfig)
    .values({
      id: 1,
      churchLat: church.coordinates.latitude,
      churchLng: church.coordinates.longitude,
      checkinRadiusMeters: 150,
      addressTh: church.address.th,
      addressEn: church.address.en,
      mapEmbedUrl: church.mapEmbedUrl,
      phone: church.phone,
    })
    .onConflictDoNothing();

  // ── Sunday service window ─────────────────────────────────────────────────
  // The at-church Sunday windows that count for GPS check-in qualification.
  // (Weekday events like home worship / visitation are off-site, so they're not seeded here.)
  const existingServices = await db.select().from(schema.services);
  if (existingServices.length === 0) {
    await db.insert(schema.services).values([
      {
        nameTh: 'ศึกษาพระคัมภีร์',
        nameEn: 'Bible Study',
        dayOfWeek: 0,
        startTime: '09:30',
        endTime: '10:00',
        active: true,
      },
      {
        nameTh: 'นมัสการและเทศนา',
        nameEn: 'Worship Gathering & Sermon',
        dayOfWeek: 0,
        startTime: '10:00',
        endTime: '12:00',
        active: true,
      },
    ]);
  }

  // ── Saturday classes ──────────────────────────────────────────────────────
  await db
    .insert(schema.classOfferings)
    .values([
      {
        slug: 'english-p1-p6',
        kind: 'english',
        nameTh: 'ภาษาอังกฤษ (ป.1–ป.6)',
        nameEn: 'English (P1–P6)',
        descriptionTh: 'คลาสภาษาอังกฤษสำหรับเด็กประถม เรียนฟรี',
        descriptionEn: 'Free English class for primary-school children.',
        level: 'P1-P6',
        dayOfWeek: 6,
        startTime: '13:00',
        endTime: '15:00',
        sortOrder: 1,
      },
      {
        slug: 'guitar',
        kind: 'guitar',
        nameTh: 'กีตาร์',
        nameEn: 'Guitar',
        descriptionTh: 'คลาสกีตาร์สำหรับผู้เริ่มต้น เรียนฟรี',
        descriptionEn: 'Free guitar class for beginners.',
        level: null,
        dayOfWeek: 6,
        startTime: '13:00',
        endTime: '15:00',
        sortOrder: 2,
      },
      {
        slug: 'japanese-basic',
        kind: 'japanese',
        nameTh: 'ภาษาญี่ปุ่น (เบื้องต้น)',
        nameEn: 'Japanese (basic)',
        descriptionTh: 'คลาสภาษาญี่ปุ่นเบื้องต้น เรียนฟรี',
        descriptionEn: 'Free basic Japanese class.',
        level: 'basic',
        dayOfWeek: 6,
        startTime: '14:00',
        endTime: '15:00',
        sortOrder: 3,
      },
    ])
    .onConflictDoNothing();

  // ── Starter menu ──────────────────────────────────────────────────────────
  await db
    .insert(schema.menuItems)
    .values([
      { slug: 'espresso', nameTh: 'เอสเพรสโซ่', nameEn: 'Espresso', category: 'coffee', sortOrder: 1 },
      { slug: 'americano', nameTh: 'อเมริกาโน่', nameEn: 'Americano', category: 'coffee', sortOrder: 2 },
      { slug: 'latte', nameTh: 'ลาเต้', nameEn: 'Latte', category: 'coffee', sortOrder: 3 },
      { slug: 'cappuccino', nameTh: 'คาปูชิโน่', nameEn: 'Cappuccino', category: 'coffee', sortOrder: 4 },
      { slug: 'matcha-latte', nameTh: 'มัทฉะลาเต้', nameEn: 'Matcha Latte', category: 'non-coffee', sortOrder: 5 },
      { slug: 'thai-tea', nameTh: 'ชาไทย', nameEn: 'Thai Tea', category: 'non-coffee', sortOrder: 6 },
    ])
    .onConflictDoNothing();

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@church.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-now';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Café Admin';

  const passwordHash = await hashPassword(adminPassword);
  await db
    .insert(schema.users)
    .values({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      orderingEnabled: true,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { role: 'admin', orderingEnabled: true },
    });

  console.log('✅ Seed complete.');
  console.log(`   Admin: ${adminEmail} (set SEED_ADMIN_* env vars to customize)`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
