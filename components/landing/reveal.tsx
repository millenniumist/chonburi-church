'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger the entrance by a small delay (seconds). */
  delay?: number;
  /** Direction the element slides in from. */
  from?: 'up' | 'down' | 'none';
  /** Render as a different element (defaults to a div). */
  as?: 'div' | 'section' | 'li';
};

const OFFSET = 24;

/**
 * A tasteful fade/slide-in-on-scroll wrapper. Respects prefers-reduced-motion
 * (renders statically). Client-only because it relies on the IntersectionObserver
 * baked into framer-motion's `whileInView`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = 'up',
  as = 'div',
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    if (as === 'section') return <section className={className}>{children}</section>;
    if (as === 'li') return <li className={className}>{children}</li>;
    return <div className={className}>{children}</div>;
  }

  const offsetY = from === 'up' ? OFFSET : from === 'down' ? -OFFSET : 0;

  const animation = {
    className: cn(className),
    initial: { opacity: 0, y: offsetY },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
  };

  if (as === 'section') return <motion.section {...animation}>{children}</motion.section>;
  if (as === 'li') return <motion.li {...animation}>{children}</motion.li>;
  return <motion.div {...animation}>{children}</motion.div>;
}
