"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DEFAULT_FOOTER = {
  columns: [
    {
      heading: "เกี่ยวกับเรา",
      links: [
        { label: "ประวัติคริสตจักร", href: "/about" },
        { label: "การรับใช้", href: "/ministries" },
        { label: "ติดต่อเรา", href: "/contact" },
      ],
    },
    {
      heading: "ข้อมูล",
      links: [
        { label: "การเงิน", href: "/financial" },
        { label: "คิดต่อเรา", href: "/missions" },
        { label: "การนมัสการ", href: "/worship" },
        { label: "ข่าวสาร", href: "/about" },
      ],
    },
  ],
  bigWord: "CHONBURI",
  copyright: "คริสตจักรชลบุรี",
};

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const [footer, setFooter] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    let cancelled = false;

    async function loadFooter() {
      try {
        const res = await fetch("/api/landing?locale=th");
        if (!res.ok) return;
        const data = await res.json();
        const section = data?.footer;
        if (!cancelled && section) {
          const columns =
            Array.isArray(section.columns) && section.columns.length
              ? section.columns.map((column) => ({
                  heading: column?.heading || "",
                  links: Array.isArray(column?.links)
                    ? column.links.filter((link) => link?.href)
                    : [],
                }))
              : DEFAULT_FOOTER.columns;
          setFooter({
            columns,
            bigWord: section.bigWord || DEFAULT_FOOTER.bigWord,
            copyright: section.copyright || DEFAULT_FOOTER.copyright,
          });
        }
      } catch (error) {
        // Keep hardcoded defaults on failure
      }
    }

    loadFooter();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="relative h-[400px] sm:h-[600px] lg:h-[800px] max-h-[800px]"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="relative h-[calc(100vh+400px)] sm:h-[calc(100vh+600px)] lg:h-[calc(100vh+800px)] -top-[100vh]">
        <div className="h-[400px] sm:h-[600px] lg:h-[800px] sticky top-[calc(100vh-400px)] sm:top-[calc(100vh-600px)] lg:top-[calc(100vh-800px)]">
          <div className="bg-background py-4 sm:py-6 lg:py-8 px-4 sm:px-6 h-full w-full flex flex-col justify-between border-t border-border/50">
            <div className="flex shrink-0 gap-8 sm:gap-12 lg:gap-20">
              {footer.columns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-1 sm:gap-2">
                  <h3 className="mb-1 sm:mb-2 uppercase text-muted-foreground text-xs sm:text-sm font-semibold">
                    {column.heading}
                  </h3>
                  {column.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="text-foreground hover:text-primary transition-colors duration-300 text-sm sm:text-base"
                    >
                      {link.label ?? link.href}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
              <h1 className="text-[18vw] sm:text-[16vw] lg:text-[14vw] leading-[0.8] mt-4 sm:mt-6 lg:mt-10 text-foreground font-bold tracking-tight">
                {footer.bigWord}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                © {currentYear} {footer.copyright}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
