import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function getStats() {
  const [
    missionsCount,
    projectsCount,
    activeMissions,
    activeProjects,
    newFeedbackCount,
    totalFeedbackCount
  ] = await Promise.all([
    prisma.mission.count(),
    prisma.futureProject.count(),
    prisma.mission.count({ where: { pinned: true } }),
    prisma.futureProject.count({ where: { isActive: true } }),
    prisma.feedback.count({ where: { status: 'NEW' } }),
    prisma.feedback.count()
  ]);

  return {
    missionsCount,
    projectsCount,
    activeMissions,
    activeProjects,
    newFeedbackCount,
    totalFeedbackCount
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: 'Missions',
      count: stats.missionsCount,
      description: `${stats.activeMissions} pinned`,
      link: '/admin/missions',
      icon: '🎯'
    },
    {
      title: 'Projects',
      count: stats.projectsCount,
      description: `${stats.activeProjects} active`,
      link: '/admin/projects',
      icon: '📊'
    },
    {
      title: 'Feedback',
      count: stats.totalFeedbackCount,
      description: `${stats.newFeedbackCount} new messages`,
      link: '/admin/feedback',
      icon: '💬'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your church content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.link}
            className="bg-card rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-border"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{card.count}</p>
                <p className="text-sm text-muted-foreground/80 mt-1">{card.description}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/missions/new"
            className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-center font-medium"
          >
            + New Mission
          </Link>
          <Link
            href="/admin/projects/new"
            className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-center font-medium"
          >
            + New Project
          </Link>
          <Link
            href="/admin/config/paths"
            className="px-4 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition text-center font-medium"
          >
            Manage Path Access
          </Link>
          <Link
            href="/admin/settings"
            className="px-4 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition text-center font-medium"
          >
            General Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
