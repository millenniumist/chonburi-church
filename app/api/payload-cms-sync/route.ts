// One-shot copy of the live cc_financial content (Prisma) into the parallel
// Payload CMS collections (schema "payload"). Wipe-and-recreate: any edits made
// in the Payload admin since the last sync are overwritten. Trigger manually:
//   curl -X POST .../api/payload-cms-sync -H "x-api-key: $SYNC_API_KEY"
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Localized = { th: string; en: string }

const loc = (v: unknown): Localized => {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    return { th: String(o.th ?? ''), en: String(o.en ?? '') }
  }
  return { th: v == null ? '' : String(v), en: '' }
}

const locList = (v: unknown): { th: string[]; en: string[] } => {
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'string')) return { th: v as string[], en: [] }
    return {
      th: v.map((x) => String(x?.th ?? '')).filter(Boolean),
      en: v.map((x) => String(x?.en ?? '')),
    }
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return {
      th: Array.isArray(o.th) ? o.th.map(String) : [],
      en: Array.isArray(o.en) ? o.en.map(String) : [],
    }
  }
  return { th: [], en: [] }
}

// Minimal Lexical document wrapping plain text (one paragraph per blank line)
const lexical = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: text.split('\n\n').map((p) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: [{ type: 'text', text: p, version: 1 }],
    })),
  },
})

export async function POST(req: Request) {
  if (!process.env.SYNC_API_KEY || req.headers.get('x-api-key') !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const results: Record<string, number | string> = {}

  const wipe = async (collection: string) => {
    await payload.delete({ collection: collection as never, where: { id: { exists: true } } })
  }

  // Create with th values, then patch en onto localized fields when present
  const createLocalized = async (
    collection: string,
    thData: Record<string, unknown>,
    enData: Record<string, unknown>,
  ) => {
    const doc = await payload.create({
      collection: collection as never,
      locale: 'th',
      data: thData as never,
    })
    if (Object.values(enData).some((v) => v !== '' && v != null)) {
      await payload.update({
        collection: collection as never,
        id: doc.id,
        locale: 'en',
        data: enData as never,
      })
    }
    return doc
  }

  const sync = async (name: string, fn: () => Promise<number>) => {
    try {
      results[name] = await fn()
    } catch (err) {
      results[name] = `ERROR: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  await sync('bulletins', async () => {
    await wipe('bulletins')
    const rows = await prisma.bulletin.findMany({ orderBy: { date: 'desc' } })
    for (const r of rows) {
      const title = loc(r.title)
      await createLocalized(
        'bulletins',
        { title: title.th, date: r.date.toISOString(), fileUrl: r.cloudinaryUrl ?? '', isActive: r.isActive },
        { title: title.en },
      )
    }
    return rows.length
  })

  await sync('leaders', async () => {
    await wipe('leaders')
    const rows = await prisma.churchLeader.findMany({ orderBy: { order: 'asc' } })
    for (const r of rows) {
      await payload.create({
        collection: 'leaders',
        locale: 'th',
        data: { name: r.name, position: r.position, imageUrl: r.image ?? '', order: r.order } as never,
      })
    }
    return rows.length
  })

  await sync('missions', async () => {
    await wipe('missions')
    const rows = await prisma.mission.findMany({ orderBy: { updatedAt: 'desc' } })
    for (const r of rows) {
      const title = loc(r.title)
      const theme = loc(r.theme)
      const summary = loc(r.summary)
      const description = loc(r.description)
      const scripture = loc(r.scripture)
      const focusAreas = locList(r.focusAreas)
      const nextSteps = locList(r.nextSteps)
      const doc = await createLocalized(
        'missions',
        {
          slug: r.slug,
          title: title.th,
          theme: theme.th,
          summary: summary.th,
          description: description.th ? lexical(description.th) : undefined,
          scripture: scripture.th,
          focusAreas: focusAreas.th.map((label) => ({ label })),
          nextSteps: nextSteps.th.map((label) => ({ label })),
          heroImageUrl: r.heroImageUrl ?? '',
          imageUrls: r.images.map((url) => ({ url })),
          pinned: r.pinned,
          startDate: r.startDate?.toISOString(),
          endDate: r.endDate?.toISOString(),
        },
        {
          title: title.en,
          theme: theme.en,
          summary: summary.en,
          description: description.en ? lexical(description.en) : undefined,
          scripture: scripture.en,
        },
      )
      // localized labels inside arrays need the created row ids
      const enArrays: Record<string, unknown> = {}
      const docAny = doc as never as { focusAreas?: { id: string }[]; nextSteps?: { id: string }[] }
      if (focusAreas.en.some(Boolean) && docAny.focusAreas) {
        enArrays.focusAreas = docAny.focusAreas.map((row, i) => ({ id: row.id, label: focusAreas.en[i] || focusAreas.th[i] }))
      }
      if (nextSteps.en.some(Boolean) && docAny.nextSteps) {
        enArrays.nextSteps = docAny.nextSteps.map((row, i) => ({ id: row.id, label: nextSteps.en[i] || nextSteps.th[i] }))
      }
      if (Object.keys(enArrays).length) {
        await payload.update({ collection: 'missions', id: doc.id, locale: 'en', data: enArrays as never })
      }
    }
    return rows.length
  })

  await sync('page-content', async () => {
    await wipe('page-content')
    const rows = await prisma.pageContent.findMany()
    for (const r of rows) {
      const title = loc(r.title)
      const subtitle = loc(r.subtitle)
      const description = loc(r.description)
      const body = loc(r.body)
      await createLocalized(
        'page-content',
        {
          page: r.page,
          section: r.section,
          title: title.th,
          subtitle: subtitle.th,
          description: description.th,
          body: body.th ? lexical(body.th) : undefined,
          metadata: r.metadata ?? undefined,
        },
        {
          title: title.en,
          subtitle: subtitle.en,
          description: description.en,
          body: body.en ? lexical(body.en) : undefined,
        },
      )
    }
    return rows.length
  })

  await sync('navigation-items', async () => {
    await wipe('navigation-items')
    const rows = await prisma.navigationItem.findMany({ orderBy: { order: 'asc' } })
    for (const r of rows) {
      const label = loc(r.label)
      await createLocalized(
        'navigation-items',
        { label: label.th, href: r.href, order: r.order, active: r.active },
        { label: label.en },
      )
    }
    return rows.length
  })

  await sync('future-projects', async () => {
    await wipe('future-projects')
    const rows = await prisma.futureProject.findMany({ orderBy: { priority: 'asc' } })
    for (const r of rows) {
      await payload.create({
        collection: 'future-projects',
        locale: 'th',
        data: {
          name: r.name,
          description: r.description ?? '',
          targetAmount: r.targetAmount,
          currentAmount: r.currentAmount,
          priority: r.priority,
          isActive: r.isActive,
          images: r.images.map((url) => ({ url })),
        } as never,
      })
    }
    return rows.length
  })

  await sync('financial-records', async () => {
    await wipe('financial-records')
    const rows = await prisma.financialRecord.findMany({ orderBy: { date: 'desc' } })
    for (const r of rows) {
      await payload.create({
        collection: 'financial-records',
        data: {
          date: r.date.toISOString(),
          income: r.income,
          expenses: r.expenses,
          balance: r.balance,
          notes: r.notes ?? '',
          incomeDetails: r.incomeDetails ?? undefined,
          expenseDetails: r.expenseDetails ?? undefined,
        } as never,
      })
    }
    return rows.length
  })

  await sync('financial-categories', async () => {
    await wipe('financial-categories')
    const rows = await prisma.financialCategory.findMany({ orderBy: { order: 'asc' } })
    for (const r of rows) {
      await payload.create({
        collection: 'financial-categories',
        data: {
          code: r.code,
          name: r.name,
          type: r.type === 'expense' ? 'expense' : 'income',
          visible: r.visible,
          aggregateInto: r.aggregateInto ?? '',
          order: r.order,
          year: r.year ?? undefined,
        } as never,
      })
    }
    return rows.length
  })

  await sync('feedback', async () => {
    await wipe('feedback')
    const rows = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } })
    for (const r of rows) {
      await payload.create({
        collection: 'feedback',
        data: {
          name: r.name,
          email: r.email || undefined,
          message: r.message,
          status: ['NEW', 'READ', 'ARCHIVED'].includes(r.status) ? r.status : 'NEW',
        } as never,
      })
    }
    return rows.length
  })

  await sync('contact-info', async () => {
    const r = await prisma.contactInfo.findFirst()
    if (!r) return 0
    const name = loc(r.name)
    const address = loc(r.address)
    const social = (r.social ?? {}) as Record<string, string>
    const coords = (r.coordinates ?? {}) as Record<string, unknown>
    const times = Array.isArray(r.worshipTimes) ? (r.worshipTimes as Record<string, unknown>[]) : []
    const updated = await payload.updateGlobal({
      slug: 'contact-info',
      locale: 'th',
      data: {
        name: name.th,
        phone: r.phone ?? '',
        email: r.email || undefined,
        address: address.th,
        mapEmbedUrl: r.mapEmbedUrl ?? '',
        social: {
          facebook: social.facebook ?? '',
          instagram: social.instagram ?? '',
          line: social.line ?? '',
          website: social.website ?? '',
          youtube: social.youtube ?? '',
        },
        coordinates: {
          latitude: String(coords.latitude ?? ''),
          longitude: String(coords.longitude ?? ''),
        },
        worshipTimes: times.map((t) => ({
          day: loc(t.day).th,
          event: loc(t.event).th,
          time: String(t.time ?? ''),
        })),
      } as never,
    })
    const rows = (updated as never as { worshipTimes?: { id: string }[] }).worshipTimes ?? []
    await payload.updateGlobal({
      slug: 'contact-info',
      locale: 'en',
      data: {
        name: name.en,
        address: address.en,
        worshipTimes: rows.map((row, i) => ({
          id: row.id,
          day: loc(times[i]?.day).en || loc(times[i]?.day).th,
          event: loc(times[i]?.event).en || loc(times[i]?.event).th,
        })),
      } as never,
    })
    return 1
  })

  return NextResponse.json({ synced: results })
}
