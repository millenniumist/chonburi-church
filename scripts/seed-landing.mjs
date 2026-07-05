// Seeds the 'landing-page' global with the landing page's original content so
// every text/verse/image starts CMS-editable with zero visual change.
// Usage: BASE=http://localhost:4310 EMAIL=... PASSWORD=... [BYPASS=...] node scripts/seed-landing.mjs
const BASE = process.env.BASE
const { EMAIL, PASSWORD, BYPASS } = process.env
if (!BASE || !EMAIL || !PASSWORD) {
  console.error('set BASE, EMAIL, PASSWORD (optional BYPASS)')
  process.exit(1)
}

const headers = { 'Content-Type': 'application/json' }
if (BYPASS) headers['x-vercel-protection-bypass'] = BYPASS

const login = await fetch(`${BASE}/payload-api/users/login`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
const { token } = await login.json()
if (!token) {
  console.error('login failed')
  process.exit(1)
}
headers.Authorization = `JWT ${token}`

const data = {
  hero: {
    brand: 'คริสตจักรชลบุรี',
    title: 'ยินดีต้อนรับสู่คริสตจักรชลบุรี',
    tagline: 'ร่วมนำข่าวประเสริฐสู่ชุมชนของเรา',
    description:
      'ร่วมเดินไปกับเราในการประกาศพระกิตติคุณ สร้างสาวก และดูแลชุมชนด้วยความรักของพระคริสต์',
    ctaLabel: 'ติดต่อเรา',
    ctaHref: '/contact',
    imageUrl: '/images/landing-hero.png',
    imageAlt: 'Congregation worship service inside a modern church',
    socialHeading: 'ติดตามถ่ายทอดสดและกิจกรรมล่าสุด',
  },
  featured: {
    subtitle: 'กิจกรรมและการนมัสการ',
    title: 'เข้าร่วมนมัสการและสามัคคีธรรมกับเรา',
    description:
      'ร่วมมอบเวลาพิเศษแด่พระเจ้าในทุกวันอาทิตย์ และต่อยอดความสัมพันธ์ผ่านกิจกรรมที่หนุนใจทุกวัย',
    bullets: [
      { text: 'การนมัสการประจำสัปดาห์ พร้อมบทเรียนพระคัมภีร์สำหรับทุกวัย' },
      { text: 'กลุ่มสามัคคีธรรมและกิจกรรมพิเศษสำหรับครอบครัวและเยาวชน' },
      { text: 'กิจกรรมบริการสังคมและพันธกิจชุมชนตลอดปี' },
    ],
    ctaLabel: 'ดูตารางกิจกรรม',
    ctaHref: '/worship',
    imageUrl: '/images/landing-featured.png',
    imageAlt: 'Exterior of a church building with cross signage',
  },
  promo: {
    imageUrl: '/images/image.png',
    imageAlt: 'Come to Jesus',
    badge: 'พระคัมภีร์',
    heroVerse: {
      text: 'บรรดาผู้ที่เหน็ดเหนื่อย\nและแบกหนักอยู่\nจงมาหาเรา\nและเราจะให้ท่านทั้งหลายได้หยุดพัก',
      reference: 'มัทธิว 11:28',
    },
    gospelTitle: 'ข่าวประเสริฐแห่งความรอด',
    verses: [
      {
        text: 'เพราะว่าพระเจ้าทรงรักโลก จนได้ทรงประทานพระบุตรองค์เดียวของพระองค์ เพื่อทุกคนที่วางใจในพระบุตรนั้นจะไม่พินาศ แต่มีชีวิตนิรันดร์',
        reference: 'ยอห์น 3:16',
      },
      {
        text: 'ด้วยว่าซึ่งท่านทั้งหลายรอดนั้นก็รอดโดยพระคุณเพราะความเชื่อ และมิใช่โดยตัวท่านทั้งหลายกระทำเอง แต่พระเจ้าทรงประทานให้',
        reference: 'เอเฟซัส 2:8',
      },
    ],
    closingVerse: {
      text: 'เหตุฉะนั้นถ้าผู้ใดอยู่ในพระคริสต์ ผู้นั้นก็เป็นคนที่ถูกสร้างใหม่แล้ว\nสิ่งสารพัดเก่าๆก็ล่วงไป นี่แน่ะกลายเป็นสิ่งใหม่ทั้งนั้น',
      reference: '2 โครินธ์ 5:17',
    },
    ctaLabel: 'ติดต่อเรา',
    ctaHref: '/contact',
  },
  footer: {
    columns: [
      {
        heading: 'เกี่ยวกับเรา',
        links: [
          { label: 'ประวัติคริสตจักร', href: '/about' },
          { label: 'การรับใช้', href: '/ministries' },
          { label: 'ติดต่อเรา', href: '/contact' },
        ],
      },
      {
        heading: 'ข้อมูล',
        links: [
          { label: 'การเงิน', href: '/financial' },
          { label: 'คิดต่อเรา', href: '/missions' },
          { label: 'การนมัสการ', href: '/worship' },
          { label: 'ข่าวสาร', href: '/about' },
        ],
      },
    ],
    bigWord: 'CHONBURI',
    copyright: 'คริสตจักรชลบุรี',
  },
}

const res = await fetch(`${BASE}/payload-api/globals/landing-page?locale=th`, {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
})
const body = await res.json()
console.log(res.ok ? 'landing-page global seeded' : `FAILED: ${JSON.stringify(body).slice(0, 300)}`)
process.exit(res.ok ? 0 : 1)
