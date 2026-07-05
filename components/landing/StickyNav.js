"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_NAV_ITEMS = [
  { id: "home", name: "หน้าแรก", href: "/" },
  { id: "about", name: "เกี่ยวกับเรา", href: "/about" },
  { id: "worship", name: "การนมัสการ", href: "/worship" },
  { id: "missions", name: "คิดต่อเรา", href: "/missions" },
  { id: "projects", name: "โครงการ", href: "/projects" },
  { id: "financial", name: "การเงิน", href: "/financial" },
  { id: "contact", name: "ติดต่อเรา", href: "/contact" },
];

export default function StickyNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show nav at the top (first 100px) OR near the bottom (within 200px of end)
      const isAtTop = scrollY < 100;
      const isAtBottom = scrollY + windowHeight >= documentHeight - 200;

      if (isAtTop || isAtBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Run on mount to check initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setMenuOpen(false);
    }
  }, [isVisible]);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigation() {
      try {
        // Load settings and navigation in parallel
        const [navRes, configRes] = await Promise.all([
          fetch("/api/navigation?locale=th"),
          fetch("/api/admin/config/paths")
        ]);

        if (!navRes.ok) {
          throw new Error("Failed to load navigation");
        }

        const navData = await navRes.json();
        const configData = configRes.ok ? await configRes.json() : { paths: [] };
        const disabledPaths = configData.paths || [];

        let itemsToFilter = DEFAULT_NAV_ITEMS;
        if (Array.isArray(navData.items) && navData.items.length) {
          itemsToFilter = navData.items.map((item) => ({
            id: item.id,
            name: item.label ?? item.href,
            href: item.href,
          }));
        }

        if (!cancelled) {
          const filteredItems = itemsToFilter.filter(
            item => !disabledPaths.some(dp => item.href === dp || item.href.startsWith(`${dp}/`))
          );
          setNavItems(filteredItems);
        }
      } catch (error) {
        console.warn("StickyNav fallback to defaults", error);
        
        // Even in error, try to fetch config to filter defaults
        if (!cancelled) {
          try {
            const configRes = await fetch("/api/admin/config/paths");
            if (configRes.ok) {
              const configData = await configRes.json();
              const disabledPaths = configData.paths || [];
              const filteredDefaults = DEFAULT_NAV_ITEMS.filter(
                item => !disabledPaths.some(dp => item.href === dp || item.href.startsWith(`${dp}/`))
              );
              setNavItems(filteredDefaults);
            } else {
              setNavItems(DEFAULT_NAV_ITEMS);
            }
          } catch (e) {
            setNavItems(DEFAULT_NAV_ITEMS);
          }
        }
      }
    }

    loadNavigation();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              {/* Logo */}
              <Link
                href="/"
                className="text-foreground text-sm uppercase tracking-wide font-semibold hover:opacity-70 transition-opacity"
              >
                คริสตจักรชลบุรี
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/90 transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                aria-expanded={menuOpen}
                aria-controls="sticky-mobile-nav"
              >
                เมนู
                <span className="relative h-3 w-4">
                  <span
                    className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-current transition ${
                      menuOpen ? 'translate-y-1.5 rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-current transition ${
                      menuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`absolute inset-x-0 top-3 h-0.5 rounded-full bg-current transition ${
                      menuOpen ? '-translate-y-1.5 -rotate-45' : ''
                    }`}
                  />
                </span>
              </button>

              {/* Navigation Links */}
              <div className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-foreground hover:text-primary transition-colors text-sm uppercase"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <AnimatePresence initial={false}>
              {menuOpen && (
                <motion.div
                  id="sticky-mobile-nav"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="pb-3 md:hidden"
                >
                  <div className="mt-2 grid max-h-[calc(100dvh-4rem)] gap-2 overflow-y-auto overscroll-contain rounded-xl border border-border/20 bg-muted/50 p-3">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide text-foreground/90 transition hover:bg-muted"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
