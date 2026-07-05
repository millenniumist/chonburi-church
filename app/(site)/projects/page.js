import Link from 'next/link';
import { generateMetadata as genMetadata } from '@/lib/seo';
import StickyNav from '@/components/landing/StickyNav';
import { prisma } from '@/lib/prisma';
import ImageCarousel from '@/components/ImageCarousel';

export const metadata = genMetadata({
  title: 'โครงการ',
  description: 'โครงการและเป้าหมายของคริสตจักรชลบุรี ภาค7 - ร่วมสนับสนุนโครงการในอนาคต',
  path: '/projects',
  keywords: ['โครงการ', 'เป้าหมาย', 'การสนับสนุน'],
});

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function getProjects() {
  // Fetch directly from database to avoid fetch issues
  const projects = await prisma.futureProject.findMany({
    where: { isActive: true },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  // Transform to match expected format
  return projects.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description,
    goal: project.targetAmount,
    current: project.currentAmount,
    percentage: project.targetAmount > 0
      ? Math.round((project.currentAmount / project.targetAmount) * 100)
      : 0,
    priority: project.priority,
    isActive: project.isActive,
    images: Array.isArray(project.images) ? project.images : []
  }));
}

export default async function ProjectsPage() {
  let projects;

  try {
    projects = await getProjects();
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-destructive">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <main className="bg-white">
        <StickyNav />
        <div className="min-h-screen">
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-semibold">โครงการในอนาคต</h1>
                <p className="text-muted-foreground">ยังไม่มีโครงการในขณะนี้</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <StickyNav />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              โครงการในอนาคต
            </h1>
            <p className="text-lg text-muted-foreground">
              ความคืบหน้าการระดมทุนสำหรับโครงการพัฒนาคริสตจักร
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div
                key={project.id || index}
                data-slot="card"
                className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl p-8 border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                {project.images && project.images.length > 0 && (
                  <ImageCarousel images={project.images} alt={project.name} />
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ความคืบหน้า</span>
                      <span className="font-medium">{project.percentage}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(project.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        เงินถวายปัจจุบัน
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        ฿{formatCurrency(project.current)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        เป้าหมาย
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        ฿{formatCurrency(project.goal)}
                      </p>
                    </div>
                  </div>

                  {/* Remaining Amount */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      เหลืออีก{' '}
                      <span className="font-medium text-foreground">
                        ฿{formatCurrency(project.goal - project.current)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      </div>
    </main>
  );
}
