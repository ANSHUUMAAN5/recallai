const ITEMS = [
  "C++17",
  "HNSW",
  "KD-Tree",
  "FastAPI",
  "Next.js",
  "react-three-fiber",
  "Docker",
  "Render",
  "MiniLM",
  "GSAP",
];

export default function Marquee() {
  const track = [...ITEMS, ...ITEMS];

  return (
    <div
      className="group relative overflow-hidden border-y border-border py-5"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-mono text-sm uppercase tracking-[0.15em] text-muted"
          >
            {item}
            <span className="text-secondary">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
