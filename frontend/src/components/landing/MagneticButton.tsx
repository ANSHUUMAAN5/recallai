"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  children: React.ReactNode;
  className?: string;
}

// Wraps any element and makes it drift slightly toward the cursor
// on hover, then spring back on leave — a small tactile touch that
// reads as "this is alive," not just a static button.
export default function MagneticButton({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (window.matchMedia("(hover: none)").matches) {
      return;
    }

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    function handleMove(event: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      xTo(relX * 0.25);
      yTo(relY * 0.4);
    }

    function handleLeave() {
      xTo(0);
      yTo(0);
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
