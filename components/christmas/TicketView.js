import { CalendarDays, Clock, MapPin, Camera } from "lucide-react";
import ChristmasShell from "./ChristmasShell";

export default function TicketView({ event, registration, fontClass }) {
  const issued = new Date(registration.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
  const left = (
    <div className="xmas-rise">
      <p className="inline-flex items-center gap-2 rounded-full border border-[#f6c46a]/25 bg-[#03060f]/60 px-4 py-1.5 text-center text-xs text-[#f6c46a] backdrop-blur-md sm:text-sm">
        <Camera className="h-4 w-4" />
        {event.ticketNote}
      </p>
    </div>
  );
  const right = (
    <article className="xmas-ticket xmas-rise relative w-full overflow-hidden rounded-[28px] text-center" style={{ animationDelay: "120ms" }}>
      <div className="px-6 pb-6 pt-7 sm:px-10 sm:pt-9">
        <p className="text-xs tracking-[0.3em] text-[#f6c46a]/80">ADMIT ONE · บัตรเชิญ</p>
        <p className="mt-5 text-sm text-white/55">เรียนเชิญ</p>
        <p className="mt-1 font-[family-name:var(--font-xmas-serif)] text-3xl font-semibold text-white sm:text-4xl">
          {registration.displayName || "ท่านผู้มีเกียรติ"}
        </p>
        <p className="mt-5 text-sm text-white/55">ร่วมงาน</p>
        <p className="xmas-title mt-1 text-balance font-[family-name:var(--font-xmas-serif)] text-[clamp(1.5rem,7vw,2.25rem)] font-semibold">{event.title}</p>
        <ul className="mt-6 space-y-1.5 text-white/85">
          {[[CalendarDays, event.dateLabel], [Clock, event.timeLabel], [MapPin, event.venue]].filter(([, v]) => v).map(([Icon, v]) => (
            <li key={v} className="flex items-center justify-center gap-2"><Icon className="h-4 w-4 text-[#f6c46a]" />{v}</li>
          ))}
        </ul>
      </div>
      <div className="relative border-t border-dashed border-white/15 px-7 py-5 sm:px-10">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#03060f]" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#03060f]" />
        <div className="flex items-center justify-between text-left">
          <div>
            <p className="text-[11px] tracking-widest text-white/40">TICKET</p>
            <p className="font-mono text-xl tracking-[0.2em] text-[#f8dca4]">{registration.tId.toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] tracking-widest text-white/40">ออกบัตรเมื่อ</p>
            <p className="text-sm text-white/75">{issued}</p>
          </div>
        </div>
      </div>
    </article>
  );
  return <ChristmasShell centered fontClass={fontClass} venue={event.venue} left={left} right={right} />;
}
