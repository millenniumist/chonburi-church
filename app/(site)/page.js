"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatured from "@/components/landing/LandingFeatured";
import LandingPromo from "@/components/landing/LandingPromo";
import LandingFooter from "@/components/landing/LandingFooter";
import StickyNav from "@/components/landing/StickyNav";

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="bg-background">
      <StickyNav />
      <LandingHero />
      <LandingFeatured />
      <LandingPromo />
      <LandingFooter />
    </main>
  );
}
