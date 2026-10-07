"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ChristmasScene = dynamic(() => import("./ChristmasScene"), { ssr: false });

// Night-sky backdrop + fixed 3D scene + two-column stage (tree | panel).
export default function ChristmasShell({ fontClass, venue, pulse, left, right, centered = false }) {
  return (
    <div className={`${fontClass} xmas relative min-h-[100svh] overflow-x-hidden bg-[#03060f] text-[#f6efe2]`}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 100%, #0d2a5c 0%, #071a3d 35%, #040a1a 70%, #02040b 100%)",
        }}
      />
      <ChristmasScene pulse={pulse} layout={centered ? "center" : "split"} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.65) 100%)" }}
      />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-md transition hover:border-[#f6c46a]/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          {venue}
        </Link>
      </header>

      {centered ? (
        <main className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-md flex-col items-center justify-center gap-4 px-5 py-6">
          {right}
          {left}
        </main>
      ) : (
        <main className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-[50svh] sm:px-8 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:pt-6">
          <section className="relative text-center lg:self-end lg:pb-2 lg:text-left">
            <div aria-hidden className="pointer-events-none absolute -inset-x-16 -inset-y-10 -z-10 bg-[radial-gradient(closest-side,rgba(2,4,11,.75),transparent)]" />
            {left}
          </section>
          <section className="w-full max-w-lg justify-self-center lg:justify-self-end">{right}</section>
        </main>
      )}
    </div>
  );
}
