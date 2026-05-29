import type { Localized } from '@/lib/i18n';

/**
 * Editorial content as typed, version-controlled data (see ADR-0001 — no CMS in
 * v1). Slice 1 (landing) renders from here. Keep every field bilingual.
 */

export const site = {
  name: { th: 'คาเฟ่ & ข่าวประเสริฐ', en: 'Coffee & Gospel' } satisfies Localized,
  tagline: {
    th: 'มาจิบกาแฟด้วยกัน',
    en: 'Come sip a coffee together',
  } satisfies Localized,
  hero: {
    heading: {
      th: 'กาแฟดีๆ บทสนทนาอบอุ่น และข่าวดีสำหรับคุณ',
      en: 'Good coffee, warm conversation, and good news for you',
    } satisfies Localized,
    body: {
      th: 'แวะมานั่งจิบกาแฟกับเรา ไม่มีค่าใช้จ่าย เราอยากรู้จักคุณ และอยากเล่าเรื่องราวของพระเยซูให้คุณฟัง',
      en: 'Drop by for a cup of coffee on us. We would love to get to know you — and to share the story of Jesus.',
    } satisfies Localized,
    primaryCta: { th: 'ดูเมนู', en: 'See the menu' } satisfies Localized,
    secondaryCta: { th: 'มาครั้งแรกใช่ไหม?', en: 'First time here?' } satisfies Localized,
  },
  gospel: {
    heading: { th: 'ข่าวประเสริฐคืออะไร', en: 'What is the good news?' } satisfies Localized,
    body: {
      th: 'พระเจ้าทรงรักคุณ และทรงส่งพระเยซูมาเพื่อคืนความสัมพันธ์ระหว่างคุณกับพระองค์ คุณได้รับการต้อนรับเสมอ ไม่ว่าคุณจะเป็นใครหรือมาจากไหน',
      en: 'God loves you and sent Jesus to restore your relationship with him. Whoever you are, wherever you are from — you are welcome here.',
    } satisfies Localized,
  },
  story: {
    heading: { th: 'เรื่องราวของคาเฟ่เรา', en: 'Our café story' } satisfies Localized,
    body: {
      th: 'คาเฟ่ของเราเปิดเพื่อเป็นพื้นที่ให้ชุมชนมาพบปะ พักผ่อน และรู้สึกเป็นที่ต้อนรับ กาแฟทุกแก้วเสิร์ฟด้วยใจ',
      en: 'Our café exists to be a place where the community can meet, rest, and feel welcomed. Every cup is served with care.',
    } satisfies Localized,
  },
  firstVisit: {
    heading: { th: 'มาครั้งแรก คาดหวังอะไรได้บ้าง', en: 'What to expect on your first visit' } satisfies Localized,
    steps: [
      {
        th: 'เดินเข้ามาได้เลย ไม่ต้องนัดหมาย',
        en: 'Just walk in — no appointment needed.',
      },
      {
        th: 'สั่งกาแฟฟรีหนึ่งแก้ว แล้วนั่งพักตามสบาย',
        en: 'Grab a free coffee and settle in.',
      },
      {
        th: 'มาร่วมนมัสการสักครั้ง แล้วคุณจะสั่งกาแฟออนไลน์ล่วงหน้าได้',
        en: 'Join a service once and you can order coffee online ahead of time.',
      },
    ] satisfies Localized[],
  },
  classesTeaser: {
    heading: { th: 'คลาสเรียนฟรีทุกวันเสาร์', en: 'Free classes every Saturday' } satisfies Localized,
    body: {
      th: 'ภาษาอังกฤษ (ป.1–ป.6), กีตาร์ และภาษาญี่ปุ่นเบื้องต้น — เรียนฟรีทั้งหมด',
      en: 'English (P1–P6), guitar, and basic Japanese — all completely free.',
    } satisfies Localized,
    cta: { th: 'ดูตารางคลาส', en: 'See the schedule' } satisfies Localized,
  },
} as const;
