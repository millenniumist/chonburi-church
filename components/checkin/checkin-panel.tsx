'use client';

import { useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Clock, LoaderCircle, MapPin, MapPinOff, ShieldAlert } from 'lucide-react';
import { checkInAction, type CheckInResult } from '@/lib/actions/checkin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pick, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type ServiceWindow = {
  id: string;
  name: string;
  dayLabel: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startMinutes: number;
};

type Outcome =
  | { kind: 'success'; data: CheckInResult }
  | { kind: 'out-of-range'; data: CheckInResult }
  | { kind: 'outside-window'; data: CheckInResult }
  | { kind: 'geo-denied' }
  | { kind: 'geo-unavailable' }
  | { kind: 'error'; message: string };

export function CheckInPanel({
  locale,
  services,
}: {
  locale: Locale;
  services: ServiceWindow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const busy = pending || locating;

  function handleCheckIn() {
    setOutcome(null);

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setOutcome({ kind: 'geo-unavailable' });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        startTransition(async () => {
          const result = await checkInAction({ lat: latitude, lng: longitude });
          if (!result.ok) {
            setOutcome({ kind: 'error', message: result.error });
            toast.error(result.error);
            return;
          }
          const data = result.data;
          if (data.verified) {
            setOutcome({ kind: 'success', data });
            toast.success(
              pick(
                'เช็คอินสำเร็จ! ปลดล็อกการสั่งกาแฟแล้ว',
                'Checked in! Coffee ordering is unlocked.',
                locale,
              ),
            );
            // Refresh so the gated state (orderingEnabled) updates across the app.
            router.refresh();
          } else if (!data.withinWindow) {
            setOutcome({ kind: 'outside-window', data });
          } else {
            setOutcome({ kind: 'out-of-range', data });
          }
        });
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setOutcome({ kind: 'geo-denied' });
        } else {
          setOutcome({ kind: 'geo-unavailable' });
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-5 pt-2 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-8 w-8" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            {pick(
              'เมื่อคุณมาถึงโบสถ์ในช่วงเวลานมัสการ กดปุ่มด้านล่างเพื่อยืนยันตำแหน่งของคุณ',
              'When you arrive at the church during a service, tap the button below to confirm your location.',
              locale,
            )}
          </p>
          <Button size="lg" className="w-full" onClick={handleCheckIn} disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                {locating
                  ? pick('กำลังหาตำแหน่ง…', 'Locating…', locale)
                  : pick('กำลังตรวจสอบ…', 'Verifying…', locale)}
              </>
            ) : (
              pick('เช็คอินตอนนี้', 'Check in now', locale)
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {pick(
              'เราใช้ตำแหน่ง GPS ของคุณเพื่อยืนยันว่าคุณอยู่ที่โบสถ์เท่านั้น',
              'We use your GPS location only to confirm you are at the church.',
              locale,
            )}
          </p>
        </CardContent>
      </Card>

      {outcome ? <OutcomeCard outcome={outcome} locale={locale} services={services} /> : null}

      {services.length > 0 ? (
        <section aria-label={pick('เวลานมัสการ', 'Service times', locale)} className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">
            {pick('เวลานมัสการ', 'Service times', locale)}
          </h2>
          <ul className="divide-y rounded-lg border">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">
                  {s.dayLabel} · {s.startTime}–{s.endTime}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function OutcomeCard({
  outcome,
  locale,
  services,
}: {
  outcome: Outcome;
  locale: Locale;
  services: ServiceWindow[];
}) {
  if (outcome.kind === 'success') {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            {pick('เช็คอินสำเร็จ!', 'Checked in!', locale)}
          </CardTitle>
          <CardDescription className="text-base text-foreground/80">
            {outcome.data.alreadyQualified
              ? pick(
                  'บันทึกการเข้าร่วมของคุณแล้ว — ขอบคุณที่มาร่วมนมัสการ',
                  'Your attendance is recorded — thanks for joining us.',
                  locale,
                )
              : pick(
                  'ยินดีต้อนรับ! ตอนนี้คุณสั่งกาแฟฟรีได้แล้ว',
                  'Welcome! You can now order free coffee.',
                  locale,
                )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/menu">{pick('ดูเมนูกาแฟ', 'Browse the menu', locale)}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (outcome.kind === 'out-of-range') {
    return (
      <ProblemCard
        icon={<MapPinOff className="h-5 w-5" aria-hidden />}
        title={pick('คุณอยู่ไกลเกินไป', 'You are too far away', locale)}
        body={pick(
          `ดูเหมือนคุณอยู่ห่างจากโบสถ์ประมาณ ${formatDistance(outcome.data.distanceMeters)} กรุณาเช็คอินอีกครั้งเมื่อคุณมาถึงที่โบสถ์`,
          `You appear to be about ${formatDistance(outcome.data.distanceMeters)} from the church. Please check in again once you have arrived.`,
          locale,
        )}
      />
    );
  }

  if (outcome.kind === 'outside-window') {
    const next = nextService(services);
    return (
      <ProblemCard
        icon={<Clock className="h-5 w-5" aria-hidden />}
        title={pick('ยังไม่ถึงเวลานมัสการ', 'Not during a service window', locale)}
        body={
          next
            ? pick(
                `ขณะนี้ไม่อยู่ในช่วงเวลานมัสการ นมัสการครั้งถัดไป: ${next}`,
                `It is not a service time right now. Next service: ${next}`,
                locale,
              )
            : pick(
                'ขณะนี้ไม่อยู่ในช่วงเวลานมัสการ กรุณาเช็คอินในช่วงเวลานมัสการ',
                'It is not a service time right now. Please check in during a service window.',
                locale,
              )
        }
      />
    );
  }

  if (outcome.kind === 'geo-denied') {
    return (
      <ProblemCard
        icon={<ShieldAlert className="h-5 w-5" aria-hidden />}
        title={pick('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง', 'Location permission denied', locale)}
        body={pick(
          'กรุณาอนุญาตให้เข้าถึงตำแหน่งในการตั้งค่าเบราว์เซอร์ของคุณ แล้วลองอีกครั้ง',
          'Please allow location access in your browser settings, then try again.',
          locale,
        )}
      />
    );
  }

  if (outcome.kind === 'geo-unavailable') {
    return (
      <ProblemCard
        icon={<MapPinOff className="h-5 w-5" aria-hidden />}
        title={pick('ไม่สามารถระบุตำแหน่งได้', 'Location unavailable', locale)}
        body={pick(
          'อุปกรณ์ของคุณไม่สามารถระบุตำแหน่งได้ในขณะนี้ กรุณาตรวจสอบว่าเปิด GPS แล้วลองอีกครั้ง',
          'Your device could not determine its location. Please make sure GPS is on and try again.',
          locale,
        )}
      />
    );
  }

  // outcome.kind === 'error'
  return (
    <ProblemCard
      icon={<ShieldAlert className="h-5 w-5" aria-hidden />}
      title={pick('เกิดข้อผิดพลาด', 'Something went wrong', locale)}
      body={outcome.message}
    />
  );
}

function ProblemCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className={cn('border-destructive/30 bg-destructive/5')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-foreground/80">{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/** Round a metre distance to a friendly label (e.g. "120 m" / "1.3 km"). */
function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

/**
 * The next upcoming service relative to now (client-side, display only — the
 * server is authoritative for the actual gate). The day/time labels are already
 * localized server-side. Returns a label like "Sunday 10:00–12:00" or null.
 */
function nextService(services: ServiceWindow[]): string | null {
  if (services.length === 0) return null;
  const now = new Date();
  const today = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const upcoming = [...services]
    .map((s) => {
      let delta = (s.dayOfWeek - today + 7) % 7;
      // Same day but the window already passed → push to next week.
      if (delta === 0 && s.startMinutes <= nowMinutes) delta = 7;
      return { s, key: delta * 1440 + s.startMinutes };
    })
    .sort((a, b) => a.key - b.key);

  const first = upcoming[0];
  if (!first) return null;
  const { s } = first;
  return `${s.dayLabel} ${s.startTime}–${s.endTime}`;
}
