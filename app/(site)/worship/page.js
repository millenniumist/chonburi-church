import { Card } from '@/components/ui/card';
import { generateMetadata as genMetadata } from '@/lib/seo';
import { getContactInfo } from '@/lib/contact-info';
import StickyNav from '@/components/landing/StickyNav';
import { logger } from '@/lib/logger';

export const metadata = genMetadata({
  title: 'การนมัสการ',
  description: 'เวลาและรายละเอียดการนมัสการที่คริสตจักรชลบุรี ภาค7 - ร่วมสรรเสริญพระเจ้ากับเรา',
  path: '/worship',
  keywords: ['นมัสการ', 'เวลานมัสการ', 'อธิษฐาน'],
});

// Force dynamic rendering to avoid database access during build
export const dynamic = 'force-dynamic';

export default async function WorshipPage() {
  let contactInfo;
  try {
    contactInfo = await getContactInfo('th');
    logger.info({ page: '/worship', event_type: 'page_render_success' }, 'Worship page rendered successfully');
  } catch (error) {
    logger.error({
      page: '/worship',
      event_type: 'page_render_error',
      error_message: error.message,
      error_stack: error.stack
    }, 'Failed to load worship page');
    throw error;
  }

  if (!contactInfo) {
    return (
      <main className="bg-white">
        <StickyNav />
        <section className="min-h-screen flex items-center justify-center px-6 py-24">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">ยังไม่มีข้อมูลเวลานมัสการ</h1>
            <p className="text-slate-600">
              กรุณาเพิ่มข้อมูลเวลานมัสการผ่านระบบจัดการ หรือรอดำเนินการจากผู้ดูแลเว็บไซต์
            </p>
          </div>
        </section>
      </main>
    );
  }

  const currentYear = new Date().getFullYear();
  return (
    <main className="bg-white">
      <StickyNav />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="h-px w-16 bg-primary mx-auto mb-6" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              การนมัสการ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              มาร่วมนมัสการและสรรเสริญพระเจ้ากับเรา
            </p>
          </div>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">เวลานมัสการ</h2>
            <p className="text-muted-foreground text-lg">
              เชิญชวนทุกท่านมาร่วมนมัสการพระเจ้า
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contactInfo.worshipTimes.map((worship, index) => (
              <Card key={index} className="p-10 border-0 shadow-lg">
                <div className="space-y-6">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {worship.day}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{worship.event}</h3>
                    <p className="text-5xl font-bold text-primary mb-6">{worship.time}</p>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{worship.day}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {contactInfo.social.facebookLive && (
            <div className="mt-12 text-center">
              <Card className="inline-block p-6 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-4">
                  <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground mb-1">รับชมการนมัสการแบบ Live</p>
                    <a 
                      href={contactInfo.social.facebookLive} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline"
                    >
                      Facebook Live →
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              สิ่งที่คุณจะได้พบในการนมัสการ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">การนมัสการด้วยเพลงสรรเสริญ</h3>
                  <p className="text-muted-foreground">
                    ร่วมสรรเสริญพระเจ้าด้วยเพลงไทยและสากล
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">การเทศนาพระวจนะ</h3>
                  <p className="text-muted-foreground">
                    ฟังพระวจนะของพระเจ้าที่ประยุกต์ใช้กับชีวิตประจำวัน
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">การอธิษฐาน</h3>
                  <p className="text-muted-foreground">
                    ร่วมกันอธิษฐานเพื่อคริสตจักร ชุมชน และประเทศชาติ
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">สามัคคีธรรม</h3>
                  <p className="text-muted-foreground">
                    พบปะ แบ่งปัน และสร้างความสัมพันธ์กับพี่น้องในพระคริสต์
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Weekly Mission Schedule */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">กิจกรรมรายสัปดาห์</h2>
            <p className="text-muted-foreground text-lg">
              กิจกรรมประจำสัปดาห์ของคริสตจักร
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">เยี่ยมเยียน</h3>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
                    วันพุธ
                  </div>
                  <p className="text-3xl font-bold text-primary">08:00 น.</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">นมัสการตามบ้าน</h3>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
                    วันพฤหัสบดี
                  </div>
                  <p className="text-3xl font-bold text-primary">19:00 น.</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">คืนอธิษฐาน</h3>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
                    วันศุกร์
                  </div>
                  <p className="text-3xl font-bold text-primary">19:00 น.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* First Time Visitors */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-10 sm:p-16 bg-primary/5 border-primary/20">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">มาครั้งแรก?</h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    ยินดีต้อนรับ! เราตื่นเต้นที่จะได้พบคุณ
                  </p>
                  <p>
                    ไม่ต้องกังวลเรื่องการแต่งกาย มาตามสบายได้เลย
                    เรามีคนต้อนรับที่พร้อมช่วยเหลือและตอบคำถามของคุณ
                  </p>
                  <p>
                    หากคุณมีคำถามหรือต้องการข้อมูลเพิ่มเติม
                    กรุณาติดต่อเราได้ที่หน้าติดต่อเรา
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
            © {currentYear} คริสตจักรชลบุรี ภาค7 - สงวนลิขสิทธิ์
            </p>
            <p className="text-xs text-muted-foreground">
              Chonburi Presbyterian Church - Region 7
            </p>
          </div>
        </div>
      </footer>
      </div>
    </main>
  );
}
