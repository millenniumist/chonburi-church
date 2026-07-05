"use client";

import Image from "next/image";
import { useScroll, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useTheme } from "@/components/ThemeProvider";

const DEFAULT_CONTENT = {
  brand: "คริสตจักรชลบุรี",
  title: "ยินดีต้อนรับสู่คริสตจักรชลบุรี",
  tagline: "ร่วมนำข่าวประเสริฐสู่ชุมชนของเรา",
  description:
    "ร่วมเดินไปกับเราในการประกาศพระกิตติคุณ สร้างสาวก และดูแลชุมชนด้วยความรักของพระคริสต์",
  cta: {
    label: "ติดต่อเรา",
    href: "/contact",
  },
  imageUrl: "/images/landing-hero.png",
  imageAlt: "Congregation worship service inside a modern church",
  socialHeading: "ติดตามถ่ายทอดสดและกิจกรรมล่าสุด",
};

export default function LandingHero() {
  const { colorTheme } = useTheme();
  const container = useRef();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [socialLinks, setSocialLinks] = useState({ facebook: null, youtube: null });
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "150vh"]);

  useEffect(() => {
    let cancelled = false;
    async function loadMissions() {
      try {
        const res = await fetch("/api/missions?highlightOnly=true");
        if (!res.ok) throw new Error("Failed to load missions");
        const data = await res.json();
        if (!cancelled) {
          const pinned = data?.pinned ?? [];
          setHighlights(pinned.length ? pinned : data?.missions ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setHighlights([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadContent() {
      try {
        const res = await fetch("/api/landing?locale=th");
        if (!res.ok) return;
        const data = await res.json();
        const hero = data?.hero;
        if (!cancelled && hero) {
          setContent({
            brand: hero.brand || DEFAULT_CONTENT.brand,
            title: hero.title || DEFAULT_CONTENT.title,
            tagline: hero.tagline || DEFAULT_CONTENT.tagline,
            description: hero.description || DEFAULT_CONTENT.description,
            cta: {
              label: hero.ctaLabel || DEFAULT_CONTENT.cta.label,
              href: hero.ctaHref || DEFAULT_CONTENT.cta.href,
            },
            imageUrl: hero.imageUrl || DEFAULT_CONTENT.imageUrl,
            imageAlt: hero.imageAlt || DEFAULT_CONTENT.imageAlt,
            socialHeading: hero.socialHeading || DEFAULT_CONTENT.socialHeading,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setContent(DEFAULT_CONTENT);
        }
      }
    }

    loadMissions();
    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadContactInfo() {
      try {
        const res = await fetch("/api/contact?locale=th");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.social) {
          setSocialLinks({
            facebook: data.social.facebook || null,
            youtube: data.social.youtube || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSocialLinks({ facebook: null, youtube: null });
        }
      }
    }

    loadContactInfo();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Content with Parallax */}
      <motion.div ref={container} style={{ y }} className="relative min-h-screen">
        {content.imageUrl.startsWith("/") ? (
          <Image
            src={content.imageUrl}
            fill
            alt={content.imageAlt}
            className={`object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
            priority
          />
        ) : (
          <img
            src={content.imageUrl}
            alt={content.imageAlt}
            className={`absolute inset-0 w-full h-full object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-start justify-start z-10 pt-24 md:pt-32">
          <div className="text-left text-white max-w-3xl px-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-xl">
              {content.title}
              {content.tagline && (
                <>
                  <br />
                  {content.tagline}
                </>
              )}
            </h1>
            <p className="text-sm md:text-base lg:text-lg leading-relaxed mb-8 max-w-2xl drop-shadow-lg text-white/90">
              {content.description}
            </p>
            <div className="space-y-6">
              {(loading || highlights.length > 0) && (
                <div className="grid gap-4">
                  {loading ? (
                    <div className="h-24 w-full rounded-2xl bg-white/10 animate-pulse" aria-hidden="true" />
                  ) : (
                    highlights.slice(0, 1).map((mission) => (
                      <div
                        key={mission.id}
                        className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm"
                      >
                        <p className="text-xs uppercase tracking-wide text-white/70">
                          {mission.theme}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {mission.title}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
              <Link
                href={content.cta?.href ?? DEFAULT_CONTENT.cta.href}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 transition-all duration-300 shadow-lg text-sm uppercase font-bold tracking-wider ${
                  colorTheme === 'lowkey' 
                    ? 'bg-primary border-primary text-primary-foreground hover:bg-transparent hover:text-white' 
                    : 'border-white bg-transparent text-white hover:bg-white hover:text-black'
                }`}
              >
                {content.cta?.label ?? DEFAULT_CONTENT.cta.label} <span aria-hidden="true">→</span>
              </Link>
              {(socialLinks.facebook || socialLinks.youtube) && (
                <div className="mt-8">
                  <style jsx>{`
                    @keyframes shine {
                      0% {
                        background-position: -200% center;
                      }
                      100% {
                        background-position: 200% center;
                      }
                    }
                    @keyframes wiggle {
                      0%, 100% {
                        transform: rotate(0deg) scale(1);
                      }
                      25% {
                        transform: rotate(-3deg) scale(1.05);
                      }
                      75% {
                        transform: rotate(3deg) scale(1.05);
                      }
                    }
                    @keyframes pulse-glow {
                      0%, 100% {
                        box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
                      }
                      50% {
                        box-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
                      }
                    }
                    .social-icon {
                      position: relative;
                      overflow: hidden;
                      animation: wiggle 3s ease-in-out infinite, pulse-glow 3s ease-in-out infinite;
                      background: rgba(255, 255, 255, 0.15);
                      backdrop-filter: blur(8px);
                    }
                    .social-icon::before {
                      content: '';
                      position: absolute;
                      top: 0;
                      left: -100%;
                      width: 100%;
                      height: 100%;
                      background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.2),
                        transparent
                      );
                      animation: shine 2.5s infinite;
                    }
                    .social-icon:hover {
                      animation: none;
                      background: white;
                      transform: scale(1.15);
                      box-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
                    }
                  `}</style>
                  <p className="text-white/95 font-bold text-xl mb-6 flex items-center gap-3">
                    <span className="h-0.5 w-8 bg-primary rounded-full" />
                    {content.socialHeading}
                  </p>
                  <div className="flex gap-4">
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`social-icon w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          colorTheme === 'lowkey' ? 'border-primary/50 text-white hover:text-primary' : 'border-white/50 text-white hover:text-black'
                        }`}
                        aria-label="Facebook - ติดตามถ่ายทอดสดและกิจกรรม"
                      >
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                        </svg>
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`social-icon w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          colorTheme === 'lowkey' ? 'border-primary/50 text-white hover:text-primary' : 'border-white/50 text-white hover:text-black'
                        }`}
                        aria-label="YouTube - รับชมถ่ายทอดสดและคลิปวิดีโอ"
                        style={{ animationDelay: '0.5s' }}
                      >
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
