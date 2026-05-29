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

/** A welcoming verse for the landing. Pairs with the café's "come and rest" invitation. */
export const verse = {
  text: {
    th: 'บรรดาผู้เหน็ดเหนื่อยและแบกภาระหนัก จงมาหาเรา และเราจะให้ท่านทั้งหลายได้หยุดพัก',
    en: 'Come to me, all you who are weary and burdened, and I will give you rest.',
  } satisfies Localized,
  reference: { th: 'มัทธิว 11:28', en: 'Matthew 11:28' } satisfies Localized,
} as const;

/**
 * Real Chonburi Church details (source of truth: the church site / contact record).
 * Used by the landing's "Visit Us" section and the footer. The same coordinates
 * are seeded into site_config so the GPS check-in anchors on the actual church.
 */
export const church = {
  legalName: { th: 'คริสตจักรชลบุรี ภาค 7', en: 'Chonburi Church, Region 7' } satisfies Localized,
  phone: '033-126404, 080-5664871',
  email: 'chounburichurch.info@gmail.com',
  address: {
    th: '528/10 ถ.ราษฎร์ประสงค์ ต.มะขามหย่ง อ.เมือง จ.ชลบุรี 20000',
    en: '528/10 Ratsadornprasong Road, Makham Yong, Mueang Chonburi, Chonburi 20000',
  } satisfies Localized,
  coordinates: { latitude: 13.3644026, longitude: 100.9818814 },
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.23072979261!2d100.9818814148232!3d13.36440269057635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3102b407a51c4f5f%3A0x67c51ce81a95e01!2z4LiE4Lij4Li04LmA4LiX4Lio4Lih4Li14Lii4Li14Liq4Li44Lih4Li54LilIOC4geC4suC4o-C4sOC4iuC4suC4peC4seC4lyA3!5e0!3m2!1sen!2sth!4v1730322384196!5m2!1sen!2sth',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=13.3644026,100.9818814',
  social: {
    facebook: 'https://www.facebook.com/ChonburiChurch',
    facebookLive: 'https://www.facebook.com/ChonburiChurch/live/',
    youtube: 'https://www.youtube.com/@ChonburiChurch',
  },
  worshipTimes: [
    {
      day: { th: 'วันอาทิตย์', en: 'Sunday' },
      time: '09:30 – 10:00',
      event: { th: 'ศึกษาพระคัมภีร์', en: 'Bible Study' },
    },
    {
      day: { th: 'วันอาทิตย์', en: 'Sunday' },
      time: '10:00 – 12:00',
      event: { th: 'นมัสการและเทศนา', en: 'Worship Gathering & Sermon' },
    },
    {
      day: { th: 'วันพุธ', en: 'Wednesday' },
      time: '08:00',
      event: { th: 'เยี่ยมเยียนสมาชิก', en: 'Member Visitation' },
    },
    {
      day: { th: 'วันพฤหัสบดี', en: 'Thursday' },
      time: '19:00',
      event: { th: 'นมัสการตามบ้าน', en: 'Home Worship' },
    },
    {
      day: { th: 'วันศุกร์', en: 'Friday' },
      time: '19:00',
      event: { th: 'ประชุมอธิษฐาน', en: 'Prayer Meeting' },
    },
  ],
} as const;
