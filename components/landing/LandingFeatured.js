"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

const DEFAULT_CONTENT = {
  subtitle: "กิจกรรมและการนมัสการ",
  title: "เข้าร่วมนมัสการและสามัคคีธรรมกับเรา",
  description:
    "ร่วมมอบเวลาพิเศษแด่พระเจ้าในทุกวันอาทิตย์ และต่อยอดความสัมพันธ์ผ่านกิจกรรมที่หนุนใจทุกวัย",
  bullets: [
    "การนมัสการประจำสัปดาห์ พร้อมบทเรียนพระคัมภีร์สำหรับทุกวัย",
    "กลุ่มสามัคคีธรรมและกิจกรรมพิเศษสำหรับครอบครัวและเยาวชน",
    "กิจกรรมบริการสังคมและพันธกิจชุมชนตลอดปี",
  ],
  cta: {
    label: "ดูตารางกิจกรรม",
    href: "/worship",
  },
  image: {
    src: "/images/landing-featured.png",
    alt: "Exterior of a church building with cross signage",
  },
};

export default function LandingFeatured() {
  const { colorTheme } = useTheme();
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const res = await fetch("/api/landing?locale=th");
        if (!res.ok) return;
        const data = await res.json();
        const featured = data?.featured;
        if (!cancelled && featured) {
          const bullets = Array.isArray(featured.bullets)
            ? featured.bullets.map((bullet) => bullet?.text).filter(Boolean)
            : [];
          setContent({
            subtitle: featured.subtitle || DEFAULT_CONTENT.subtitle,
            title: featured.title || DEFAULT_CONTENT.title,
            description: featured.description || DEFAULT_CONTENT.description,
            bullets: bullets.length ? bullets : DEFAULT_CONTENT.bullets,
            cta: {
              label: featured.ctaLabel || DEFAULT_CONTENT.cta.label,
              href: featured.ctaHref || DEFAULT_CONTENT.cta.href,
            },
            image: {
              src: featured.imageUrl || DEFAULT_CONTENT.image.src,
              alt: featured.imageAlt || DEFAULT_CONTENT.image.alt,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setContent(DEFAULT_CONTENT);
        }
      }
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-6 py-12 bg-background">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <div className="relative h-[320px] sm:h-[420px] lg:h-[500px] w-full overflow-hidden rounded-3xl shadow-xl">
          {content.image.src.startsWith("/") ? (
            <Image
              src={content.image.src}
              alt={content.image.alt}
              fill
              className={`object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
              priority
            />
          ) : (
            <img
              src={content.image.src}
              alt={content.image.alt}
              className={`absolute inset-0 h-full w-full object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
            />
          )}
        </div>

        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {content.subtitle}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight text-foreground">
              {content.title}
            </h2>
          </div>
          <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl">
            {content.description}
          </p>
          <ul className="space-y-4 text-sm text-foreground">
            {content.bullets.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 flex-shrink-0 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href={content.cta?.href ?? DEFAULT_CONTENT.cta.href}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-105"
          >
            {content.cta?.label ?? DEFAULT_CONTENT.cta.label} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

