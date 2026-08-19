"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "@/components/landing/Hero3D";
import MagneticButton from "@/components/landing/MagneticButton";
import Marquee from "@/components/landing/Marquee";

const PIPELINE = [
  {
    tag: "01 / ENGINE",
    title: "A vector database, written from scratch",
    body: "Brute-force, KD-tree, and HNSW — the approximate-nearest-neighbor algorithm production vector databases actually run — hand-built in C++. Not a wrapper around Pinecone or FAISS.",
  },
  {
    tag: "02 / INGEST",
    title: "PDF or text, chunked and embedded",
    body: "Overlapping character chunks through all-MiniLM-L6-v2 → 384-dimensional embeddings, pushed straight into the engine.",
  },
  {
    tag: "03 / RETRIEVE",
    title: "Grounded answers, cited by page and chunk",
    body: "Every answer is traced back to the exact source it came from — strictly grounded when documents exist, honestly labeled when they don't.",
  },
  {
    tag: "04 / SERVE",
    title: "C++ engine, FastAPI, Next.js — deployed for real",
    body: "Three services, actually running in production, with the real infrastructure tradeoffs documented instead of hidden.",
  },
];

const STATS = [
  { value: 3, label: "Search algorithms", suffix: "" },
  { value: 384, label: "Embedding dimensions", suffix: "-D" },
  { value: 3, label: "LLM providers supported", suffix: "" },
  { value: 0, label: "External vector DB used", suffix: "" },
];

function PipelineCard({ item }: { item: (typeof PIPELINE)[number] }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      data-pipeline-item
      onMouseMove={handleMove}
      className="group relative overflow-hidden bg-surface p-8 transition-transform duration-300 hover:-translate-y-1"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), var(--color-accent-soft), transparent 70%)",
        }}
      />
      <div className="relative">
        <p className="mb-4 font-mono text-[11px] tracking-[0.15em] text-accent">
          {item.tag}
        </p>
        <h3 className="mb-2 text-lg font-medium text-ink">{item.title}</h3>
        <p className="text-sm leading-relaxed text-muted">{item.body}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set("[data-reveal]", { opacity: 1, y: 0 });
        gsap.utils.toArray<HTMLElement>("[data-stat-value]").forEach((el) => {
          el.textContent = el.getAttribute("data-stat-value");
        });
        return;
      }

      // Hero entrance
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-eyebrow]", { opacity: 0, y: 14, duration: 0.6 })
        .from(
          "[data-hero-title]",
          { opacity: 0, y: 28, duration: 0.9 },
          "-=0.35",
        )
        .from(
          "[data-hero-sub]",
          { opacity: 0, y: 18, duration: 0.7 },
          "-=0.55",
        )
        .from(
          "[data-hero-cta]",
          { opacity: 0, y: 14, duration: 0.6 },
          "-=0.45",
        )
        .from(
          "[data-hero-3d]",
          { opacity: 0, scale: 0.92, duration: 1.1, ease: "power2.out" },
          "-=0.9",
        );

      // Generic scroll reveals
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 32,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Pipeline items step in with a stagger as a group
      gsap.from("[data-pipeline-item]", {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-pipeline-list]",
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      // Stat numbers count up once, the first time they scroll in
      gsap.utils.toArray<HTMLElement>("[data-stat-value]").forEach((el) => {
        const target = Number(el.getAttribute("data-stat-value"));
        const counter = { value: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(counter, {
              value: target,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(counter.value).toString();
              },
            });
          },
        });
      });

      // Hero graph drifts slightly with scroll for depth
      gsap.to("[data-hero-3d]", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-full overflow-x-clip bg-canvas text-ink selection:bg-accent/15 selection:text-accent-hover"
    >
      {/* ================================================= */}
      {/* Nav */}
      {/* ================================================= */}

      <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border bg-canvas/80 px-6 py-4 backdrop-blur-md sm:px-10">
        <span className="text-sm font-semibold tracking-[0.2em] text-ink">
          RECALLAI
        </span>
        <div className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.15em] text-muted sm:flex">
          <a href="#pitch" className="transition-colors hover:text-ink">
            Why
          </a>
          <a href="#pipeline" className="transition-colors hover:text-ink">
            Pipeline
          </a>
          <a
            href="https://github.com/ANSHUUMAAN5/recallai"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink"
          >
            Source
          </a>
        </div>
        <Link
          href="/workspace"
          className="rounded-full border border-border-strong px-4 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Launch →
        </Link>
      </nav>

      {/* ================================================= */}
      {/* Hero */}
      {/* ================================================= */}

      <section
        data-hero
        className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 sm:px-10"
      >
        <div
          className="orb orb-a -left-24 top-10 h-72 w-72 bg-accent/20"
          aria-hidden="true"
        />
        <div
          className="orb orb-b right-0 bottom-0 h-96 w-96 bg-secondary/15"
          aria-hidden="true"
        />

        <div
          data-hero-3d
          className="pointer-events-none absolute inset-y-0 right-[-8%] w-[70%] opacity-90 sm:right-0 sm:w-[55%]"
        >
          <Hero3D />
        </div>

        <div className="relative z-10 max-w-2xl">
          <p
            data-hero-eyebrow
            className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-secondary"
          >
            (Self-hosted RAG · custom C++ vector engine)
          </p>

          <h1
            data-hero-title
            className="font-[family-name:var(--font-display)] text-[15vw] font-semibold leading-[0.92] tracking-tight sm:text-[7.5rem]"
          >
            <span className="text-gradient-ink">RECALL</span>
            <span className="text-secondary">AI</span>
          </h1>

          <p
            data-hero-sub
            className="mt-6 font-[family-name:var(--font-serif-italic)] text-2xl italic text-ink-soft sm:text-3xl"
          >
            search that understands what you meant.
          </p>

          <p
            data-hero-sub
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted"
          >
            Upload a PDF or a text file, ask a question in plain English, and
            get an answer grounded in your document — with the exact page
            and chunk it came from. The retrieval underneath runs on a
            vector search engine built from scratch, not a wrapper around
            someone else&apos;s database.
          </p>

          <div data-hero-cta className="mt-9 flex items-center gap-5">
            <MagneticButton>
              <Link
                href="/workspace"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-transform hover:scale-[1.03]"
              >
                Launch RecallAI
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </MagneticButton>
            <a
              href="https://github.com/ANSHUUMAAN5/recallai"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
            >
              View source
            </a>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ================================================= */}
      {/* In one breath */}
      {/* ================================================= */}

      <section id="pitch" className="px-6 py-32 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p
            data-reveal
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-faint"
          >
            (In one breath)
          </p>
          <p
            data-reveal
            className="text-[28px] font-medium leading-[1.35] text-ink-soft sm:text-4xl"
          >
            Most RAG portfolio projects are the same forty lines of glue —{" "}
            <span className="font-[family-name:var(--font-serif-italic)] italic text-muted">
              call an embeddings API, call Pinecone, call an LLM.
            </span>{" "}
            RecallAI builds the one part everyone else treats as a black
            box:{" "}
            <span className="font-[family-name:var(--font-serif-italic)] italic text-accent">
              the index itself
            </span>{" "}
            — brute-force, KD-tree, and a real HNSW graph, written in C++,
            explainable line by line.
          </p>
        </div>
      </section>

      {/* ================================================= */}
      {/* Stats */}
      {/* ================================================= */}

      <section className="border-t border-border px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} data-reveal>
              <p className="font-[family-name:var(--font-display)] text-4xl font-semibold text-ink sm:text-5xl">
                <span data-stat-value={stat.value}>0</span>
                {stat.suffix}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.1em] text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* Pipeline */}
      {/* ================================================= */}

      <section id="pipeline" className="relative border-t border-border px-6 py-32 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p
            data-reveal
            className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint"
          >
            (How it works)
          </p>
          <h2 data-reveal className="mb-16 max-w-xl text-3xl font-medium text-ink sm:text-4xl">
            Document in, cited answer out.
          </h2>

          <div data-pipeline-list className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {PIPELINE.map((item) => (
              <PipelineCard key={item.tag} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Final CTA */}
      {/* ================================================= */}

      <section className="relative overflow-hidden border-t border-border px-6 py-32 sm:px-10">
        <div
          className="orb orb-a left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 bg-accent/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-8">
          <p
            data-reveal
            className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-ink sm:text-5xl"
          >
            Upload something.
            <br />
            <span className="text-accent">Ask it anything.</span>
          </p>
          <div data-reveal>
            <MagneticButton>
              <Link
                href="/workspace"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-[1.03] hover:bg-accent-hover"
              >
                Launch RecallAI
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </MagneticButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.15em] text-faint sm:flex-row">
          <span>RecallAI — self-hosted RAG, custom C++ vector engine</span>
          <a
            href="https://github.com/ANSHUUMAAN5/recallai"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink"
          >
            github.com/ANSHUUMAAN5/recallai
          </a>
        </div>
      </footer>
    </div>
  );
}
