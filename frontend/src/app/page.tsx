"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "@/components/landing/Hero3D";

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
      className="min-h-full bg-neutral-950 text-neutral-100 selection:bg-cyan-400/20 selection:text-cyan-200"
    >
      {/* ================================================= */}
      {/* Nav */}
      {/* ================================================= */}

      <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/5 bg-neutral-950/70 px-6 py-4 backdrop-blur-md sm:px-10">
        <span className="text-sm font-semibold tracking-[0.2em] text-neutral-100">
          RECALLAI
        </span>
        <div className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500 sm:flex">
          <a href="#pitch" className="transition-colors hover:text-neutral-200">
            Why
          </a>
          <a href="#pipeline" className="transition-colors hover:text-neutral-200">
            Pipeline
          </a>
          <a
            href="https://github.com/ANSHUUMAAN5/recallai"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-neutral-200"
          >
            Source
          </a>
        </div>
        <Link
          href="/workspace"
          className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
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
          data-hero-3d
          className="pointer-events-none absolute inset-y-0 right-[-8%] w-[70%] opacity-70 sm:right-0 sm:w-[55%]"
        >
          <Hero3D />
        </div>

        <div className="relative z-10 max-w-2xl">
          <p
            data-hero-eyebrow
            className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400/80"
          >
            (Self-hosted RAG · custom C++ vector engine)
          </p>

          <h1
            data-hero-title
            className="font-[family-name:var(--font-display)] text-[15vw] font-semibold leading-[0.92] tracking-tight sm:text-[7.5rem]"
          >
            <span className="text-gradient-metal">RECALL</span>
            <span className="text-cyan-400">AI</span>
          </h1>

          <p
            data-hero-sub
            className="mt-6 font-[family-name:var(--font-serif-italic)] text-2xl italic text-neutral-300 sm:text-3xl"
          >
            search that understands what you meant.
          </p>

          <p
            data-hero-sub
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-neutral-400"
          >
            Upload a PDF or a text file, ask a question in plain English, and
            get an answer grounded in your document — with the exact page
            and chunk it came from. The retrieval underneath runs on a
            vector search engine built from scratch, not a wrapper around
            someone else&apos;s database.
          </p>

          <div data-hero-cta className="mt-9 flex items-center gap-5">
            <Link
              href="/workspace"
              className="group inline-flex items-center gap-2 rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-950 transition-transform hover:scale-[1.03]"
            >
              Launch RecallAI
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <a
              href="https://github.com/ANSHUUMAAN5/recallai"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 transition-colors hover:text-neutral-200"
            >
              View source
            </a>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* In one breath */}
      {/* ================================================= */}

      <section id="pitch" className="px-6 py-32 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p
            data-reveal
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600"
          >
            (In one breath)
          </p>
          <p
            data-reveal
            className="text-[28px] font-medium leading-[1.35] text-neutral-200 sm:text-4xl"
          >
            Most RAG portfolio projects are the same forty lines of glue —{" "}
            <span className="font-[family-name:var(--font-serif-italic)] italic text-neutral-400">
              call an embeddings API, call Pinecone, call an LLM.
            </span>{" "}
            RecallAI builds the one part everyone else treats as a black
            box:{" "}
            <span className="font-[family-name:var(--font-serif-italic)] italic text-cyan-300">
              the index itself
            </span>{" "}
            — brute-force, KD-tree, and a real HNSW graph, written in C++,
            explainable line by line.
          </p>
        </div>
      </section>

      {/* ================================================= */}
      {/* Pipeline */}
      {/* ================================================= */}

      <section id="pipeline" className="border-t border-white/5 px-6 py-32 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p
            data-reveal
            className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600"
          >
            (How it works)
          </p>
          <h2 data-reveal className="mb-16 max-w-xl text-3xl font-medium text-neutral-100 sm:text-4xl">
            Document in, cited answer out.
          </h2>

          <div data-pipeline-list className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2">
            {PIPELINE.map((item) => (
              <div
                key={item.tag}
                data-pipeline-item
                className="group bg-neutral-950 p-8 transition-colors hover:bg-neutral-900"
              >
                <p className="mb-4 font-mono text-[11px] tracking-[0.15em] text-cyan-400/80">
                  {item.tag}
                </p>
                <h3 className="mb-2 text-lg font-medium text-neutral-100">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Final CTA */}
      {/* ================================================= */}

      <section className="border-t border-white/5 px-6 py-32 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-8">
          <p
            data-reveal
            className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-neutral-100 sm:text-5xl"
          >
            Upload something.
            <br />
            <span className="text-gradient-metal">Ask it anything.</span>
          </p>
          <div data-reveal>
            <Link
              href="/workspace"
              className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3.5 text-sm font-semibold text-neutral-950 transition-transform hover:scale-[1.03]"
            >
              Launch RecallAI
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-600 sm:flex-row">
          <span>RecallAI — self-hosted RAG, custom C++ vector engine</span>
          <a
            href="https://github.com/ANSHUUMAAN5/recallai"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-neutral-300"
          >
            github.com/ANSHUUMAAN5/recallai
          </a>
        </div>
      </footer>
    </div>
  );
}
