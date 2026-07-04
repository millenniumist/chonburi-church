import { readFile } from 'node:fs/promises';
import path from 'node:path';

let cache = null;

function getSiteDataPath() {
  return path.join(process.cwd(), 'content', 'site-data.json');
}

export async function loadSiteData() {
  if (cache) {
    return cache;
  }

  try {
    const filePath = getSiteDataPath();
    const content = await readFile(filePath, 'utf8');
    cache = JSON.parse(content);
  } catch (error) {
    // Missing/corrupt snapshot should degrade to empty sections, not a 500.
    console.error('Failed to load content/site-data.json:', error.message);
    cache = {};
  }
  return cache;
}

export async function getMinistriesData() {
  const data = await loadSiteData();
  return data.ministries ?? [];
}

export async function getUpcomingEventsData() {
  const data = await loadSiteData();
  return data.upcomingEvents ?? [];
}

export async function getNewsData() {
  const data = await loadSiteData();
  return data.news ?? [];
}

export async function getSermonsData() {
  const data = await loadSiteData();
  return data.sermons ?? [];
}

export async function getContactSnapshot() {
  const data = await loadSiteData();
  return data.contact ?? {};
}
