'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addPath(formData) {
  const path = formData.get('path');
  
  if (!path || typeof path !== 'string') {
    return { error: 'Invalid path' };
  }

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  try {
    await prisma.pathConfig.create({
      data: {
        path: cleanPath,
        isEnabled: true,
      },
    });
    revalidatePath('/admin/config/paths');
    return { success: true };
  } catch (error) {
    console.error('Failed to add path:', error);
    return { error: 'Failed to add path. It might already exist.' };
  }
}

export async function togglePath(id, isEnabled) {
  try {
    await prisma.pathConfig.update({
      where: { id },
      data: { isEnabled },
    });
    revalidatePath('/admin/config/paths');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle path:', error);
    return { error: 'Failed to update path status' };
  }
}

export async function deletePath(id) {
  try {
    await prisma.pathConfig.delete({
      where: { id },
    });
    revalidatePath('/admin/config/paths');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete path:', error);
    return { error: 'Failed to delete path' };
  }
}

export async function getAvailablePaths() {
  // Common public paths in the application
  return [
    '/about',
    '/bulletins',
    '/contact',
    '/financial',
    '/ministries',
    '/missions',
    '/projects',
    '/worship',
  ];
}
