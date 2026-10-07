import { CalendarDays, Clock, MapPin } from "lucide-react";
import Countdown from "./Countdown";

export default function EventHero({ event }) {
  const details = [
    [CalendarDays, event.dateLabel],
    [Clock, event.timeLabel],
    [MapPin, event.venue],
  ].filter(([, v]) => v);

  return (
    <div className="xmas-rise">
      <p className="inline-flex items-center gap-2 rounded-full border border-[#f6c46a]/25 bg-[#f6c46a]/[0.07] px-4 py-1.5 text-xs font-medium tracking-[0.18em] text-[#f6c46a]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f6c46a]" />
        {event.eyebrow}
      </p>
      <h1 className="xmas-title mt-5 font-[family-name:var(--font-xmas-serif)] text-[clamp(2rem,8.6vw,4.4rem)] font-semibold leading-[1.2] text-balance lg:whitespace-nowrap lg:text-[clamp(2.6rem,3.9vw,3.6rem)]">
        {event.title}
      </h1>
      {event.verse && (
        <blockquote className="mx-auto mt-5 max-w-md whitespace-pre-line font-[family-name:var(--font-xmas-serif)] text-base italic leading-relaxed text-white/65 lg:mx-0">
          “{event.verse}”
          {event.verseRef && <footer className="mt-2 text-sm not-italic text-[#f6c46a]/80">— {event.verseRef}</footer>}
        </blockquote>
      )}
      <ul className="mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start">
        {details.map(([Icon, v]) => (
          <li key={v} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/85 backdrop-blur-md">
            <Icon className="h-4 w-4 text-[#f6c46a]" />
            {v}
          </li>
        ))}
      </ul>
      <Countdown target={event.eventDate} />
    </div>
  );
}
