/**
 * Seed baseline data: site config, the Sunday service window, the three free
 * Saturday classes, a starter menu, and an admin user.
 *
 * Run with: npm run db:seed
 * Idempotent-ish: uses onConflictDoNothing where a natural key exists.
 */
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  // Import after env is loaded so the db client sees DATABASE_URL.
  const { db } = await import('@/lib/db');
  const { hashPassword } = await import('@/lib/auth/password');
  const schema = await import('@/lib/db/schema');
  const { church } = await import('@/content/site');
  const { SECTIONS, SECTION_KEYS } = await import('@/lib/cms/sections');

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

  // ── CMS: editable site content (ADR-0004) ────────────────────────────────
  // Upsert every registered section from the content/site.ts defaults.
  // `onConflictDoNothing` on the key so admin edits are never clobbered by a
  // re-seed.
  for (const key of SECTION_KEYS) {
    await db
      .insert(schema.siteContent)
      .values({ key, value: SECTIONS[key].default })
      .onConflictDoNothing({ target: schema.siteContent.key });
  }

  // ── CMS: sample announcements ─────────────────────────────────────────────
  // Idempotent via the unique `slug`.
  await db
    .insert(schema.announcements)
    .values([
      {
        slug: 'grand-opening',
        titleTh: 'เปิดคาเฟ่แล้ววันนี้!',
        titleEn: 'Our café is now open!',
        bodyTh: 'แวะมารับกาแฟฟรีแก้วแรกของคุณได้แล้ววันนี้ เรารอต้อนรับคุณอยู่',
        bodyEn: 'Come by for your first free cup of coffee — we would love to welcome you.',
        publishedAt: new Date('2026-05-01T03:00:00.000Z'),
        active: true,
        sortOrder: 1,
      },
      {
        slug: 'saturday-classes-open',
        titleTh: 'เปิดรับสมัครคลาสวันเสาร์',
        titleEn: 'Saturday classes are open for sign-up',
        bodyTh: 'คลาสภาษาอังกฤษ กีตาร์ และภาษาญี่ปุ่นเบื้องต้น เรียนฟรีทุกวันเสาร์ สมัครได้แล้ววันนี้',
        bodyEn: 'Free English, guitar, and basic Japanese classes every Saturday. Sign up today.',
        publishedAt: new Date('2026-05-10T03:00:00.000Z'),
        active: true,
        sortOrder: 2,
      },
    ])
    .onConflictDoNothing({ target: schema.announcements.slug });

  // ── CRM: families, members, donations & class attendance (ADR-0005) ───────
  // Demo directory data. Skipped in production (pass SEED_DEMO=0) so fake
  // people/donations never pollute a real DB; otherwise guarded on an empty
  // members table so re-seeds don't duplicate (no natural unique key).
  const existingMembers =
    process.env.SEED_DEMO === '0' ? [] : await db.select().from(schema.members);
  if (process.env.SEED_DEMO !== '0' && existingMembers.length === 0) {
    const [adminUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail));
    const [englishClass] = await db
      .select()
      .from(schema.classOfferings)
      .where(eq(schema.classOfferings.slug, 'english-p1-p6'));

    const [somchaiFamily, niranFamily] = await db
      .insert(schema.families)
      .values([
        { name: 'ครอบครัวสมชาย / Somchai family', address: 'ชลบุรี', phone: '081-000-0001' },
        { name: 'ครอบครัวนิรันดร์ / Niran family', address: 'ชลบุรี', phone: '081-000-0002' },
      ])
      .returning();

    const insertedMembers = await db
      .insert(schema.members)
      .values([
        {
          familyId: somchaiFamily?.id,
          userId: adminUser?.id ?? null,
          name: adminName,
          email: adminEmail,
          status: 'member',
          joinedAt: '2024-01-07',
        },
        { familyId: somchaiFamily?.id, name: 'เด็กหญิงแก้ว / Kaew', birthDate: '2015-03-12', status: 'member' },
        { familyId: niranFamily?.id, name: 'นิรันดร์ / Niran', phone: '081-000-0002', status: 'regular', joinedAt: '2025-06-01' },
        { name: 'ผู้มาเยี่ยม / Walk-in visitor', status: 'visitor' },
      ])
      .returning();

    const [primaryMember, childMember] = insertedMembers;
    if (primaryMember) {
      await db.insert(schema.donations).values([
        { memberId: primaryMember.id, donorName: primaryMember.name, fund: 'tithe', amount: 100000, method: 'transfer', receivedAt: '2026-06-01' },
        { memberId: primaryMember.id, donorName: primaryMember.name, fund: 'general', amount: 50000, method: 'cash', receivedAt: '2026-06-08' },
        { donorName: 'ผู้ถวายนิรนาม / Anonymous', fund: 'missions', amount: 20000, method: 'promptpay', receivedAt: '2026-06-15' },
      ]);
    }
    if (englishClass && childMember) {
      await db.insert(schema.classAttendances).values([
        { classOfferingId: englishClass.id, memberId: childMember.id, sessionDate: '2026-06-07' },
        { classOfferingId: englishClass.id, memberId: childMember.id, sessionDate: '2026-06-14' },
      ]);
    }
  }

  console.log('✅ Seed complete.');
  console.log(`   Admin: ${adminEmail} (set SEED_ADMIN_* env vars to customize)`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
