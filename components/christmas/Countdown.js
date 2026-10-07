"use client";

import { useEffect, useState } from "react";

const UNITS = [
  ["วัน", 86400000],
  ["ชั่วโมง", 3600000],
  ["นาที", 60000],
  ["วินาที", 1000],
];

export default function Countdown({ target }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = target ? new Date(target).getTime() : NaN;
  if (!now || !Number.isFinite(end) || end <= now) return null;

  let left = end - now;
  return (
    <div className="mt-8 inline-flex gap-2 sm:gap-3" aria-label="นับถอยหลัง">
      {UNITS.map(([label, ms]) => {
        const v = Math.floor(left / ms);
        left -= v * ms;
        return (
          <div key={label} className="min-w-16 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center backdrop-blur-md">
            <div className="font-[family-name:var(--font-xmas-serif)] text-2xl tabular-nums text-[#f8dca4] sm:text-3xl">
              {String(v).padStart(2, "0")}
            </div>
            <div className="text-[11px] tracking-wide text-white/50">{label}</div>
          </div>
        );
      })}
    </div>
  );
}
