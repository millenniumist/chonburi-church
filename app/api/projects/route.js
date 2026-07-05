import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload-cms';
import { withLogging, logError } from '@/lib/logger';

async function getHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Fetch projects from the Payload CMS
    const payload = await getPayloadClient();
    const { docs: projects } = await payload.find({
      collection: 'future-projects',
      locale: 'th',
      fallbackLocale: 'th',
      ...(activeOnly ? { where: { isActive: { equals: true } } } : {}),
      sort: ['-priority', 'createdAt'], // Higher priority first, then by creation date
      limit: 100,
    });

    // Transform to match the expected format for the frontend
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      goal: project.targetAmount ?? 0,
      current: project.currentAmount ?? 0,
      percentage: project.targetAmount > 0
        ? Math.round((project.currentAmount / project.targetAmount) * 100)
        : 0,
      priority: project.priority ?? 0,
      isActive: project.isActive ?? false,
      images: (project.images ?? []).map(image => image.url)
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      total: formattedProjects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError(request, error, { operation: 'fetch_projects' });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const GET = withLogging(getHandler);
