import { Card } from '@/components/ui/card';
import StickyNav from '@/components/landing/StickyNav';
import MissionCard from '@/components/MissionCard';
import MissionPagination from '@/components/MissionPagination';
import { getMissions } from '@/lib/missions';
import { generateMetadata as genMetadata } from '@/lib/seo';
import ImageCarousel from '@/components/ImageCarousel';

export const metadata = genMetadata({
  title: 'พันธกิจ',
  description:
    'สำรวจพันธกิจหลักของคริสตจักรชลบุรี ภาค7 พร้อมไฮไลต์ที่กำลังดำเนินอยู่และขั้นตอนต่อไปในการรับใช้',
  path: '/missions',
  keywords: ['พันธกิจ', 'การประกาศ', 'การรับใช้', 'มิชชันนารี', 'เยาวชน'],
});

export const dynamic = 'force-dynamic';

export default async function MissionsPage({ searchParams }) {
  const page = Number.parseInt(searchParams?.page || '1', 10);
  const { pinned, missions, pagination } = await getMissions({
    page: Number.isNaN(page) ? 1 : page,
    pageSize: 4,
  });

  return (
    <main className="bg-white">
      <StickyNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white to-white pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 space-y-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              พันธกิจคริสตจักร
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              ร่วมเป็นส่วนหนึ่งของการรับใช้ที่พระเจ้าทรงมอบหมาย
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              เราเชื่อว่าพระเจ้าทรงเรียกคริสตจักรให้เป็นความสว่างแก่โลกผ่านการประกาศ การสร้างสาวก และการรับใช้ผู้คนในทุกฤดูกาล
              ทุกพันธกิจด้านล่างพร้อมเปิดพื้นที่ให้คุณร่วมอธิษฐาน สนับสนุน และลงมือทำไปด้วยกัน
            </p>
          </div>
        </div>
      </section>

      {pinned.length > 0 && (
        <section className="py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">พันธกิจไฮไลต์</h2>
                <p className="text-sm text-slate-600 mt-1">
                  พันธกิจที่ต้องการการอธิษฐานและการสนับสนุนเป็นพิเศษในช่วงนี้
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pinned.map((mission) => (
                <Card
                  key={mission.id}
                  className="p-8 bg-gradient-to-br from-primary/15 via-white to-white border border-primary/20 shadow-lg"
                >
                  {mission.images && mission.images.length > 0 && (
                    <div className="mb-6 -mx-8 -mt-8">
                      <ImageCarousel images={mission.images} alt={mission.title} />
                    </div>
                  )}
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    ไฮไลต์พิเศษ
                  </span>
                  <h3 className="text-2xl font-semibold text-slate-900 mt-3">{mission.title}</h3>
                  <p className="text-sm text-primary/80 font-semibold mt-1">{mission.theme}</p>
                  <p className="text-slate-700 leading-relaxed mt-4">{mission.summary}</p>

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                      จุดเน้น
                    </h4>
                    <ul className="mt-2 grid gap-2 text-sm text-slate-600">
                      {mission.focusAreas.map((focus) => (
                        <li
                          key={focus}
                          className="flex items-start gap-2 bg-white/70 border border-primary/10 rounded-lg px-3 py-2"
                        >
                          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                          <span>{focus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 sm:py-20 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">พันธกิจทั้งหมด</h2>
              <p className="text-sm text-slate-600 mt-1">
                เรียนรู้รายละเอียดและก้าวต่อไปของแต่ละพันธกิจ พร้อมขอความร่วมมือจากสมาชิกคริสตจักร
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>

          <MissionPagination pagination={pagination} />
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">
            อยากมีส่วนร่วมกับพันธกิจหรือไม่?
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            ไม่ว่าจะเป็นการอธิษฐาน สนับสนุนด้านทรัพยากร หรือร่วมลงมือรับใช้ด้วยตนเอง
            เรายินดีให้คุณมาร่วมเป็นครอบครัวเดียวกันในการประกาศและสร้างสาวก
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-md hover:bg-primary/90 transition"
          >
            ติดต่อเพื่อร่วมพันธกิจ
          </a>
        </div>
      </section>
    </main>
  );
}
