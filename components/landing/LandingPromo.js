"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";

import { useTheme } from "@/components/ThemeProvider";

const DEFAULT_CONTENT = {
  imageUrl: "/images/image.png",
  imageAlt: "Come to Jesus",
  badge: "พระคัมภีร์",
  heroVerse: {
    text: "บรรดาผู้ที่เหน็ดเหนื่อย\nและแบกหนักอยู่\nจงมาหาเรา\nและเราจะให้ท่านทั้งหลายได้หยุดพัก",
    reference: "มัทธิว 11:28",
  },
  gospelTitle: "ข่าวประเสริฐแห่งความรอด",
  verses: [
    {
      text: "เพราะว่าพระเจ้าทรงรักโลก จนได้ทรงประทานพระบุตรองค์เดียวของพระองค์ เพื่อทุกคนที่วางใจในพระบุตรนั้นจะไม่พินาศ แต่มีชีวิตนิรันดร์",
      reference: "ยอห์น 3:16",
    },
    {
      text: "ด้วยว่าซึ่งท่านทั้งหลายรอดนั้นก็รอดโดยพระคุณเพราะความเชื่อ และมิใช่โดยตัวท่านทั้งหลายกระทำเอง แต่พระเจ้าทรงประทานให้",
      reference: "เอเฟซัส 2:8",
    },
  ],
  closingVerse: {
    text: "เหตุฉะนั้นถ้าผู้ใดอยู่ในพระคริสต์ ผู้นั้นก็เป็นคนที่ถูกสร้างใหม่แล้ว\nสิ่งสารพัดเก่าๆก็ล่วงไป นี่แน่ะกลายเป็นสิ่งใหม่ทั้งนั้น",
    reference: "2 โครินธ์ 5:17",
  },
  cta: {
    label: "ติดต่อเรา",
    href: "/contact",
  },
};

export default function LandingPromo() {
  const { colorTheme } = useTheme();
  const container = useRef();
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const res = await fetch("/api/landing?locale=th");
        if (!res.ok) return;
        const data = await res.json();
        const promo = data?.promo;
        if (!cancelled && promo) {
          const verseCards = Array.isArray(promo.verses)
            ? promo.verses
                .filter((verse) => verse?.text)
                .map((verse) => ({
                  text: verse.text,
                  reference: verse.reference || "",
                }))
            : [];
          setContent({
            imageUrl: promo.imageUrl || DEFAULT_CONTENT.imageUrl,
            imageAlt: promo.imageAlt || DEFAULT_CONTENT.imageAlt,
            badge: promo.badge || DEFAULT_CONTENT.badge,
            heroVerse: {
              text: promo.heroVerse?.text || DEFAULT_CONTENT.heroVerse.text,
              reference: promo.heroVerse?.reference || DEFAULT_CONTENT.heroVerse.reference,
            },
            gospelTitle: promo.gospelTitle || DEFAULT_CONTENT.gospelTitle,
            verses: verseCards.length ? verseCards : DEFAULT_CONTENT.verses,
            closingVerse: {
              text: promo.closingVerse?.text || DEFAULT_CONTENT.closingVerse.text,
              reference: promo.closingVerse?.reference || DEFAULT_CONTENT.closingVerse.reference,
            },
            cta: {
              label: promo.ctaLabel || DEFAULT_CONTENT.cta.label,
              href: promo.ctaHref || DEFAULT_CONTENT.cta.href,
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

  const heroVerseLines = content.heroVerse.text.split("\n");
  const closingVerseLines = content.closingVerse.text.split("\n");

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center min-h-screen overflow-hidden py-20"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          {content.imageUrl.startsWith("/") ? (
            <Image
              src={content.imageUrl}
              fill
              alt={content.imageAlt}
              className={`object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
            />
          ) : (
            <img
              src={content.imageUrl}
              alt={content.imageAlt}
              className={`absolute inset-0 w-full h-full object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
        </motion.div>
      </div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12"
      >
        <div className="text-center space-y-12">
          {/* Matthew 11:28 - Hero Verse */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 bg-muted/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider border border-border/30">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  {content.badge}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight tracking-tight drop-shadow-xl">
                {heroVerseLines.map((line, index) => {
                  const isFirst = index === 0;
                  const isLast = index === heroVerseLines.length - 1;
                  const lineClass = isLast
                    ? `bg-gradient-to-r ${colorTheme === 'lowkey' ? 'from-white via-primary/50 to-white' : 'from-white via-neutral-400 to-white'} bg-clip-text text-transparent`
                    : index === heroVerseLines.length - 2
                      ? "text-white/90"
                      : "text-white/95";
                  return (
                    <Fragment key={index}>
                      {index > 0 && <br />}
                      <span className={lineClass}>
                        {isFirst && "“"}
                        {line}
                        {isLast && "”"}
                      </span>
                    </Fragment>
                  );
                })}
              </h2>

              <p className="text-white/80 text-lg sm:text-xl md:text-2xl font-light tracking-wide italic">
                {content.heroVerse.reference}
              </p>
            </motion.div>
          </div>

          {/* Gospel Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="space-y-6 text-white">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white drop-shadow-lg">
                {content.gospelTitle}
              </h3>

              <div className="space-y-4 text-base sm:text-lg md:text-xl leading-relaxed">
                {content.verses.map((verse, index) => (
                  <p
                    key={index}
                    className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 shadow-inner"
                  >
                    {"“"}
                    {verse.text}
                    {"”"}
                    <span className="block mt-3 text-sm text-white/50 italic">
                      — {verse.reference}
                    </span>
                  </p>
                ))}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <p className="text-white/95 text-xl sm:text-2xl md:text-3xl font-light italic leading-relaxed">
              {closingVerseLines.map((line, index) => (
                <Fragment key={index}>
                  {index > 0 && <br />}
                  {index === 0 && "“"}
                  {line}
                  {index === closingVerseLines.length - 1 && "”"}
                </Fragment>
              ))}
            </p>

            <p className="text-white/60 text-lg sm:text-xl font-medium">{content.closingVerse.reference}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link
                href={content.cta?.href ?? DEFAULT_CONTENT.cta.href}
                className={`inline-flex items-center gap-2 rounded-full px-10 py-5 text-lg font-bold uppercase tracking-wider transition-all duration-300 shadow-xl ${
                  colorTheme === 'lowkey'
                    ? 'bg-primary text-primary-foreground hover:bg-white hover:text-primary shadow-primary/20'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {content.cta?.label ?? DEFAULT_CONTENT.cta.label}
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
