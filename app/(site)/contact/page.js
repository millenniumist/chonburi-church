import { Card } from '@/components/ui/card';
import { generateMetadata as genMetadata } from '@/lib/seo';
import { getContactInfo } from '@/lib/contact-info';
import StickyNav from '@/components/landing/StickyNav';
import FeedbackForm from '@/components/contact/FeedbackForm';

// Force dynamic rendering to avoid database access during build
export const dynamic = 'force-dynamic';

export const metadata = genMetadata({
  title: 'ติดต่อเรา',
  description: 'ติดต่อคริสตจักรชลบุรี ภาค7 - ที่อยู่ เวลาทำการ และช่องทางการติดต่อ ยินดีต้อนรับทุกท่าน',
  path: '/contact',
  keywords: ['ติดต่อคริสตจักร', 'ที่อยู่', 'เวลาทำการ', 'แผนที่'],
});

export default async function ContactPage() {
  const contactInfo = await getContactInfo('th');

  if (!contactInfo) {
    return (
      <main className="bg-white">
        <StickyNav />
        <section className="min-h-screen flex items-center justify-center px-6 py-24">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">ยังไม่มีข้อมูลการติดต่อ</h1>
            <p className="text-slate-600">
              กรุณาเพิ่มข้อมูลการติดต่อผ่านระบบจัดการ หรือรอดำเนินการจากผู้ดูแลเว็บไซต์
            </p>
          </div>
        </section>
      </main>
    );
  }

  const currentYear = new Date().getFullYear();
  const googleMapsLink = `https://maps.google.com/?q=${encodeURIComponent(contactInfo.address.th)}`;

  return (
    <main className="bg-white">
      <StickyNav />
      <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4">
            <div className="inline-block"><div className="h-px w-16 bg-primary mx-auto mb-6" /></div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">ติดต่อเรา</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">เรายินดีที่จะได้ยินจากคุณ</p>
            <div className="pt-4">
              <a
                href="#feedback-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                แสดงความคิดเห็น
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-10 border-0 shadow-lg">
              <div className="space-y-8">
                {/* Address Section */}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">ที่อยู่</h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {contactInfo.name}<br />
                      {contactInfo.address.th}
                    </p>
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=528+10+Ras+Prasong+Rd,+Makham+Yong,+Chon+Buri+District,+Chon+Buri+20000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      เปิดใน Google Maps
                    </a>
                  </div>
                </div>

                {/* Phone Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">โทรศัพท์</h3>
                    <a href={`tel:${contactInfo.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                {/* Email Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">อีเมล</h3>
                    <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground hover:text-primary transition-colors break-all">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-10 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">เวลาเปิดทำการ</h3>
                  <ul className="space-y-4 text-muted-foreground">
                    {contactInfo.worshipTimes.map((time, index) => (
                      <li key={index} className="rounded-xl bg-primary/5 p-4">
                        <p className="text-base font-semibold text-foreground">
                          {time.day} • {time.time} น.
                        </p>
                        <p className="text-sm mt-1">
                          {time.event}
                        </p>
                      </li>
                    ))}
                    <li className="rounded-xl bg-primary/5 p-4">
                      <p className="text-base font-semibold text-foreground">วันอื่นๆ</p>
                      <p className="text-sm mt-1">นัดหมายล่วงหน้า</p>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

          </div>

          {/* Google Maps Section - Full Width */}
          <div className="mt-8">
            <Card className="p-0 border-0 shadow-lg overflow-hidden">
              <div className="h-80 sm:h-96 w-full">
                <iframe
                  title="แผนที่คริสตจักรชลบุรี"
                  src={contactInfo.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-6 sm:p-8 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">ดูแผนที่ใน Google Maps</h3>
                  <p className="text-sm text-slate-600">คลิกเพื่อเปิดแผนที่และเส้นทางบนอุปกรณ์ของคุณ</p>
                </div>
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
                >
                  เปิดใน Google Maps
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block"><div className="h-px w-12 bg-primary mx-auto mb-4" /></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">เชื่อมต่อกับเรา</h2>
            <p className="text-muted-foreground text-lg">ติดตามข่าวสารและกิจกรรมของคริสตจักร</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contactInfo.social.facebook && (
              <a href={contactInfo.social.facebook} target="_blank" rel="noopener noreferrer">
                <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Facebook</h3>
                </Card>
              </a>
            )}
            {contactInfo.social.youtube && (
              <a href={contactInfo.social.youtube} target="_blank" rel="noopener noreferrer">
                <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">YouTube</h3>
                </Card>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section id="feedback-section" className="py-20 sm:py-24 bg-slate-50/50 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block"><div className="h-px w-12 bg-primary mx-auto mb-4" /></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">แสดงความคิดเห็น</h2>
            <p className="text-muted-foreground text-lg">เราให้ความสำคัญกับความคิดเห็นของคุณ เพื่อการพัฒนาที่ดียิ่งขึ้น</p>
          </div>
          <FeedbackForm />
        </div>
      </section>

      {/* Prayer Request */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">คำขออธิษฐาน</h2>
          <p className="text-muted-foreground text-lg mb-6">หากคุณต้องการให้คริสตจักรอธิษฐานเผื่อคุณ กรุณาติดต่อผู้นำคริสตจักรหรือแจ้งในวันนมัสการ</p>
          <p className="text-sm text-muted-foreground italic">&ldquo;คำอธิษฐานของคนชอบธรรมมีพลังทำให้เกิดผล&rdquo; - ยากอบ 5:16</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">© {currentYear} คริสตจักรชลบุรี ภาค7 - สงวนลิขสิทธิ์</p>
            <p className="text-xs text-muted-foreground">Chonburi Presbyterian Church - Region 7</p>
          </div>
        </div>
      </footer>
      </div>
    </main>
  );
}
