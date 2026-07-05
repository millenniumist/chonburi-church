import { Card } from '@/components/ui/card';
import { generateMetadata as genMetadata } from '@/lib/seo';
import StickyNav from '@/components/landing/StickyNav';
import { getMinistriesData, getUpcomingEventsData } from '@/lib/site-data';

export const metadata = genMetadata({
  title: 'กิจกรรม',
  description:
    'กิจกรรมและการรับใช้ที่คริสตจักรชลบุรี ภาค7 - กลุ่มเซลล์ กิจการต่างๆ และการเข้าร่วม',
  path: '/ministries',
  keywords: ['กิจกรรม', 'กลุ่มเซลล์', 'การรับใช้'],
});

function buildDescription({ title, schedule }) {
  if (!schedule) {
    return `กิจกรรม "${title}" จากเว็บไซต์คริสตจักรชลบุรี`;
  }
  return `กิจกรรม "${title}" จัดตามกำหนด ${schedule} (อ้างอิงจากเว็บไซต์คริสตจักรชลบุรี)`;
}

export default async function MinistriesPage() {
  const [ministriesSource, upcomingEvents] = await Promise.all([
    getMinistriesData(),
    getUpcomingEventsData(),
  ]);

  const currentYear = new Date().getFullYear();

  const ministries = ministriesSource.map((ministry) => ({
    title: ministry.title,
    schedule: ministry.schedule ?? 'ติดตามประกาศเพิ่มเติม',
    description: buildDescription(ministry),
  }));

  const highlightedEvents = upcomingEvents.slice(0, 4);

  return (
    <main className="bg-white">
      <StickyNav />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center space-y-4">
              <div className="inline-block">
                <div className="h-px w-16 bg-primary mx-auto mb-6" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                กิจกรรมและกลุ่มเซลล์
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                รวบรวมข้อมูลกิจกรรมจากเว็บไซต์คริสตจักรชลบุรี เพื่อให้คุณอัปเดตได้ตลอดเวลา
              </p>
            </div>
          </div>
        </section>

        {/* Main Ministries */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block">
                <div className="h-px w-12 bg-primary mx-auto mb-4" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">กิจกรรมหลัก</h2>
              <p className="text-muted-foreground text-lg">ข้อมูลจากหน้าเว็บไซต์คริสตจักรชลบุรี</p>
            </div>

            {ministries.length === 0 ? (
              <div
                data-slot="card"
                className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 text-center shadow-sm"
              >
                <p className="text-muted-foreground">
                  ยังไม่มีข้อมูลกิจกรรมในขณะนี้ โปรดกลับมาตรวจสอบอีกครั้ง หรือดูประกาศล่าสุดในหน้า
                  Facebook ของคริสตจักร
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ministries.map((ministry, index) => (
                  <Card
                    key={`${ministry.title}-${index}`}
                    className="p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">{ministry.title}</h3>
                      <div className="text-sm text-primary font-medium">{ministry.schedule}</div>
                      <p className="text-muted-foreground">{ministry.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Highlighted Events */}
        <section className="py-20 sm:py-24 bg-slate-50/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block">
                <div className="h-px w-12 bg-primary mx-auto mb-4" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">กิจกรรมพิเศษ</h2>
              <p className="text-muted-foreground text-lg">
                ข้อมูลงานสำคัญจากปฏิทินกิจกรรมในเว็บไซต์หลักของคริสตจักร
              </p>
            </div>

            {highlightedEvents.length === 0 ? (
              <div
                data-slot="card"
                className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 text-center shadow-sm"
              >
                <p className="text-muted-foreground">
                  ยังไม่มีประกาศกิจกรรมพิเศษในช่วงนี้ โปรดติดตามช่องทางหลักของคริสตจักร
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {highlightedEvents.map((event, index) => (
                  <Card key={`${event.title}-${index}`} className="p-6 space-y-3 border-primary/10">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      {event.date || 'ประกาศล่าสุด'}
                    </span>
                    <h3 className="text-2xl font-semibold text-slate-900">{event.title}</h3>
                    <p className="text-sm text-primary/80 font-medium">{event.schedule}</p>
                    <p className="text-sm text-muted-foreground">
                      ข้อมูลงานถูกซิงก์อัตโนมัติจาก www.chonburichurch.com เพื่อให้สมาชิกเตรียมตัวร่วมกิจกรรมได้ถูกต้อง
                    </p>
                  </Card>
                ))}
              </div>
            )}
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
