"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Plant Memory", href: "#memory" },
  { label: "Security", href: "#security" },
  { label: "Pilot", href: "#pilot" },
];

const CONTACT_EMAIL = "hi@reelin.ai";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Operadroom Inquiry")}&body=${encodeURIComponent("Hi,\n\nI'm interested in learning more about Operadroom.\n\n")}`;

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="ml-2">
      <path d="M1 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 22C12.5 13 19.5 9 25 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 16H26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  );
}

function GhostButton({
  children,
  href,
  onClick,
  eventName,
  eventProps,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  eventName?: string;
  eventProps?: Record<string, string>;
}) {
  const className =
    "inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 sm:py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-white/80 hover:bg-white hover:text-black transition-all duration-300";

  const handleClick = () => {
    if (eventName) trackEvent(eventName, eventProps);
    onClick?.();
  };

  if (href) {
    return (
      <a href={href} onClick={handleClick} className={className}>
        {children}
        <ArrowIcon />
      </a>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
      <ArrowIcon />
    </button>
  );
}

function KenBurnsBg({
  src,
  speed = "slow",
}: {
  src: string;
  speed?: "hero" | "slow" | "medium";
}) {
  const speedClass =
    speed === "hero" ? "ken-burns-hero" : speed === "medium" ? "ken-burns-medium" : "ken-burns-slow";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={`ken-burns-layer ${speedClass}`}
        style={{ backgroundImage: `url('${src}')` }}
      />
    </div>
  );
}

function ImagePanel({
  src,
  alt = "",
  overlay = "dark",
  className = "",
  animate = true,
  frame = "editorial",
}: {
  src: string;
  alt?: string;
  overlay?: "dark" | "light" | "none";
  className?: string;
  animate?: boolean;
  frame?: "editorial" | "soft" | "none";
}) {
  const overlayClass =
    overlay === "dark"
      ? "bg-gradient-to-t from-black/60 via-black/10 to-black/20"
      : overlay === "light"
        ? "bg-gradient-to-t from-black/40 via-transparent to-transparent"
        : "";

  const frameClass =
    frame === "editorial"
      ? "rounded-[1.35rem] sm:rounded-[1.75rem] rounded-tr-[2.75rem] sm:rounded-tr-[4.5rem] rounded-bl-[2rem] sm:rounded-bl-[3.25rem] rounded-tl-md rounded-br-md shadow-[0_28px_90px_rgba(0,0,0,0.42)] lg:-rotate-1 lg:origin-center"
      : frame === "soft"
        ? "rounded-xl sm:rounded-2xl"
        : "";

  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-black ${frameClass} ${className}`}
      role="img"
      aria-label={alt}
    >
      {animate ? (
        <KenBurnsBg src={src} speed="medium" />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${src}')` }}
        />
      )}
      {overlay !== "none" && <div className={`absolute inset-0 z-[1] ${overlayClass}`} />}
    </div>
  );
}

function FullBleedBanner({
  src,
  label,
  title,
  body,
}: {
  src: string;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <section className="relative min-h-[45vh] sm:min-h-[55vh] flex items-center border-t border-white/5 overflow-hidden">
      <KenBurnsBg src={src} speed="slow" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 w-full">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">{label}</p>
        <h2 className="text-[clamp(1.35rem,5vw,2.5rem)] font-bold uppercase tracking-tight max-w-xl">
          {title}
        </h2>
        <p className="mt-4 sm:mt-5 text-[14px] sm:text-[15px] text-white/60 max-w-lg leading-relaxed">{body}</p>
      </div>
    </section>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
          <LogoMark className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:text-white transition-colors" />
          <span className="text-[11px] sm:text-[13px] font-semibold tracking-[0.22em] sm:tracking-[0.35em] uppercase">
            Operadroom
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {NAV.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => trackEvent("nav_click", { section: label.toLowerCase().replace(" ", "_") })}
              className="text-[11px] font-medium tracking-[0.16em] uppercase text-white/70 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden text-[11px] tracking-widest uppercase text-white/70"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-black/95 px-6 py-4 space-y-4">
          {NAV.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => {
                setOpen(false);
                trackEvent("nav_click", { section: label.toLowerCase().replace(" ", "_"), device: "mobile" });
              }}
              className="block text-[11px] tracking-[0.16em] uppercase text-white/70"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <KenBurnsBg src="/images/hero-offshore.jpg" speed="hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent sm:from-black/85 sm:via-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 sm:pb-24 pt-28 sm:pt-32 md:pb-32">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/50 mb-4 sm:mb-5 animate-fade-up">
          A Reelin AI Product
        </p>
        <h1 className="text-[clamp(1.75rem,8vw,4.25rem)] font-bold leading-[1.08] sm:leading-[1.05] tracking-tight max-w-3xl uppercase animate-fade-up-delay">
          Turn Decades of Plant Records Into an Agentic Brain
        </h1>
        <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] md:text-[17px] text-white/65 max-w-xl leading-relaxed animate-fade-up-delay-2">
          Chemical plants, refineries, and upstream assets sit on centuries of paper archives, scattered PDFs, and
          trapped institutional knowledge. Operadroom digitizes legacy records, indexes them with AI, and deploys agents
          that search, reason, and execute — every action sealed on-chain via Reelin ID.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-up-delay-2">
          <GhostButton href="#pilot" eventName="cta_click" eventProps={{ action: "request_pilot", location: "hero" }}>
            Request Pilot
          </GhostButton>
          <GhostButton href="#platform" eventName="cta_click" eventProps={{ action: "explore_platform", location: "hero" }}>
            Explore Platform
          </GhostButton>
        </div>
      </div>
    </section>
  );
}

function SplitSection({
  id,
  label,
  title,
  body,
  reverse,
  visual,
}: {
  id?: string;
  label: string;
  title: string;
  body: string;
  reverse?: boolean;
  visual: React.ReactNode;
}) {
  return (
    <section id={id} className="min-h-0 lg:min-h-[85vh] flex items-center border-t border-white/5">
      <div
        className={`max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center w-full ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div>
          <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">{label}</p>
          <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase leading-tight tracking-tight">
            {title}
          </h2>
          <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] md:text-[16px] text-white/60 leading-relaxed max-w-lg">
            {body}
          </p>
        </div>
        <div className="w-full">{visual}</div>
      </div>
    </section>
  );
}

function FlowDiagram() {
  const steps = [
    { n: "01", title: "Digitize", desc: "Low-cost scan of legacy archive rooms — paper, microfilm, and hard-drive PDFs" },
    { n: "02", title: "Index", desc: "AI agent OCRs, catalogs, tags equipment IDs, and builds a knowledge graph" },
    { n: "03", title: "Query", desc: "Engineers ask plain-English questions — answers cite the exact source page" },
    { n: "04", title: "Act", desc: "Agents draft Safe Isolation, resolve anomalies, and release work orders — HITL always" },
  ];

  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div
          key={s.n}
          className="border border-white/10 bg-white/[0.03] p-4 sm:p-6 hover:border-white/20 transition-colors"
        >
          <div className="flex items-baseline gap-3 sm:gap-4">
            <span className="text-[11px] tracking-[0.2em] text-white/35">{s.n}</span>
            <h3 className="text-[13px] sm:text-[15px] font-semibold tracking-wide uppercase">{s.title}</h3>
          </div>
          <p className="mt-2 sm:ml-10 text-[12px] sm:text-[13px] text-white/50 leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

function ArchitectureVisual() {
  return (
    <div className="relative aspect-[4/3] sm:aspect-[16/11] border border-white/10 overflow-hidden rounded-[1.35rem] sm:rounded-[1.75rem] rounded-tl-[2.5rem] sm:rounded-tl-[3.5rem] rounded-br-[2rem] sm:rounded-br-[3rem] rounded-tr-md rounded-bl-md shadow-[0_28px_90px_rgba(0,0,0,0.42)] lg:rotate-1 lg:origin-center">
      <KenBurnsBg src="/images/data-network.jpg" speed="slow" />
      <div className="absolute inset-0 bg-black/60 z-[1]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] z-[2]" />
      <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-8 gap-3 sm:gap-4 text-[10px] sm:text-[11px] tracking-wider uppercase">
        <div className="border border-white/30 px-4 py-3 bg-white/[0.08] font-semibold">Plant Memory · AI Agent</div>
        <div className="text-center text-white/30">↓</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-white/15 px-3 py-2 text-white/50 bg-black/30">Legacy Archive</div>
          <div className="border border-white/15 px-3 py-2 text-white/50 bg-black/30">Knowledge Graph</div>
        </div>
        <div className="text-center text-white/30">↓</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-white/15 px-3 py-2 text-white/50 bg-black/30">SAP / ERP</div>
          <div className="border border-white/15 px-3 py-2 text-white/50 bg-black/30">Reelin ID Audit</div>
        </div>
        <div className="text-center text-white/30">↓</div>
        <div className="border border-dashed border-white/20 px-4 py-3 text-white/45 bg-black/20">
          Human Sign-Off
        </div>
      </div>
    </div>
  );
}

function UseCasesSection() {
  const cases = [
    {
      title: "Legacy Archive Digitization",
      desc: "Shell and peers stopped corporate digitization — too expensive. Operadroom scans one room, AI indexes every page, no manual keying.",
      image: "/images/factory-floor.jpg",
    },
    {
      title: "Institutional Memory Search",
      desc: "Retired engineers take decades of handwritten knowledge with them. Query the full archive in seconds with cited sources.",
      image: "/images/machinery.jpg",
    },
    {
      title: "Safe Isolation & Execution",
      desc: "Once records are live, agents trace legacy P&IDs, draft isolation plans, and compile SAP-ready work orders for engineer release.",
      image: "/images/industrial-workers.jpg",
    },
  ];

  return (
    <section id="use-cases" className="border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">Use Cases</p>
        <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase tracking-tight max-w-2xl">
          Records First. Then the Brain Acts.
        </h2>
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {cases.map((c, i) => (
            <div key={c.title} className="bg-black group overflow-hidden rounded-sm sm:rounded-md">
              <div className="relative h-40 sm:h-44 overflow-hidden rounded-tl-2xl rounded-tr-md rounded-bl-md rounded-br-3xl sm:rounded-br-[3.5rem] mx-3 mt-3 sm:mx-4 sm:mt-4">
                <div
                  className={`ken-burns-layer ken-burns-medium ${i === 1 ? "ken-burns-slow" : ""}`}
                  style={{ backgroundImage: `url('${c.image}')`, animationDelay: `${i * 2}s` }}
                />
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/30 to-transparent" />
              </div>
              <div className="p-6 sm:p-8 md:p-10">
                <h3 className="text-[13px] sm:text-[14px] font-semibold tracking-wide uppercase">{c.title}</h3>
                <p className="mt-3 sm:mt-4 text-[13px] sm:text-[14px] text-white/55 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const items = [
    {
      title: "Isolated Cloud Sandbox",
      desc: "Dedicated secure tenant per facility. Customer data never trains shared models. EU or on-prem deployment available.",
    },
    {
      title: "Reelin ID · On-Chain Audit",
      desc: "Every page upload, index, search, and citation sealed on blockchain. Copy or export anomalies flagged for cyber security review.",
    },
    {
      title: "Human-in-the-Loop",
      desc: "Agents draft actions. Engineers approve before any write operation executes. Full compliance log exportable.",
    },
    {
      title: "Read-Only by Default",
      desc: "No OT access. No autonomous SAP posting. Integrates alongside Siemens, Cognite, and SAP — connective layer only.",
    },
  ];

  return (
    <section id="security" className="relative border-t border-white/5 overflow-hidden">
      <KenBurnsBg src="/images/data-center.jpg" speed="slow" />
      <div className="absolute inset-0 bg-black/85 z-[1]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">Security</p>
        <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase tracking-tight max-w-3xl">
          Your Data in a Safe Sandbox. Every Action on Chain.
        </h2>
        <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] text-white/55 max-w-2xl leading-relaxed">
          Facility records stay in an isolated cloud sandbox with Reelin ID blockchain audit. Upload a page — it is
          hashed and logged. Run a search — logged. Open a citation — logged. Cyber security can review the full chain
          at any time.
        </p>
        <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
          {items.map((item) => (
            <div key={item.title} className="bg-black/80 backdrop-blur-sm p-6 sm:p-8 border border-white/5">
              <h3 className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase">{item.title}</h3>
              <p className="mt-2 sm:mt-3 text-[13px] sm:text-[14px] text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PilotSection() {
  return (
    <section id="pilot" className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center border-t border-white/5 overflow-hidden">
      <KenBurnsBg src="/images/oil-refinery.webp" speed="slow" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/55 z-[1]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-24 w-full">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">Pilot Program</p>
        <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase tracking-tight max-w-2xl">
          90-Day Records Pilot
        </h2>
        <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] text-white/60 max-w-xl leading-relaxed">
          Start with one archive room at a refinery, chemical plant, or upstream asset. Digitize thousands of legacy
          pages, prove searchable Plant Memory, then expand to Safe Isolation and maintenance execution on the same
          corpus.
        </p>
        <div className="mt-8 sm:mt-10">
          <a
            href={CONTACT_MAILTO}
            onClick={() => trackEvent("contact_click", { location: "pilot_section", type: "enterprise_sales" })}
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 sm:py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-white/80 hover:bg-white hover:text-black transition-all duration-300"
          >
            Contact Enterprise Sales
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 sm:py-12 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="w-4 h-4 text-white/70" />
            <p className="text-[12px] font-semibold tracking-[0.3em] uppercase">Operadroom</p>
          </div>
          <p className="mt-2 text-[12px] text-white/40">A Reelin AI product</p>
        </div>
        <div className="flex flex-wrap gap-6 sm:gap-8 text-[11px] tracking-[0.14em] uppercase text-white/45">
          <a
            href="https://reelin.ai"
            onClick={() => trackEvent("outbound_click", { destination: "reelin_ai" })}
            className="hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reelin AI
          </a>
          <a
            href="https://reelin.id"
            onClick={() => trackEvent("outbound_click", { destination: "reelin_id" })}
            className="hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reelin ID
          </a>
          <a
            href={CONTACT_MAILTO}
            onClick={() => trackEvent("contact_click", { location: "footer", type: "general" })}
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <SplitSection
          id="platform"
          label="The Problem"
          title="Centuries of Records. Zero Searchability."
          body="Major operators stopped enterprise digitization — manual indexing cost millions and produced static PDFs on dead drives. Meanwhile, engineers still spend half a day in archive rooms hunting handwritten maintenance cards, legacy P&IDs, and shift logs that predate their careers."
          visual={
            <ImagePanel
              src="/images/oil-refinery.webp"
              alt="Aerial view of an oil refinery complex"
              className="aspect-[4/5] sm:aspect-[16/11] lg:aspect-[5/4] w-full max-w-lg lg:ml-auto"
            />
          }
        />
        <SplitSection
          id="memory"
          label="Plant Memory"
          title="Digitize Once. Query Forever."
          body="Operadroom Vault ingests scanned legacy archives — the AI agent runs Vision OCR, classifies documents, tags equipment IDs, extracts entities, and builds a knowledge graph. What used to require a room full of paper and hours of search becomes a conversational brain your engineers can ask in plain English."
          reverse
          visual={
            <div className="space-y-4">
              <ImagePanel
                src="/images/factory-floor.jpg"
                alt="Industrial engineer inspecting turbine equipment"
                className="aspect-[4/5] sm:aspect-[16/10] w-full max-w-lg lg:mr-auto lg:rotate-1"
                frame="editorial"
              />
              <FlowDiagram />
            </div>
          }
        />
        <SplitSection
          label="Agentic Brain"
          title="Then the Brain Solves Real Problems"
          body="Indexing is step one. Once records are live, Operadroom agents resolve Safe Isolation from legacy P&IDs, cross-reference live alerts against decades of maintenance history, prevent institutional amnesia as engineers retire, and draft SAP-ready work orders — always human-in-the-loop, always Reelin ID audited."
          visual={<ArchitectureVisual />}
        />
        <SplitSection
          label="Architecture"
          title="Integration, Not Replacement"
          body="Operadroom runs alongside Siemens, SAP, Aveva, Cognite, and IBM Maximo. We handle the connective tissue — from dusty archive to auditable agent action — without touching OT or replacing your existing stack."
          reverse
          visual={
            <ImagePanel
              src="/images/data-network.jpg"
              alt="Industrial data network visualization"
              className="aspect-[4/5] sm:aspect-[16/11] w-full max-w-lg lg:ml-auto"
            />
          }
        />
        <FullBleedBanner
          src="/images/iot-sensors.jpg"
          label="Heavy Industry"
          title="Built for Chemical Plants, Refineries, and Upstream"
          body="Legacy European facilities with decades of paper archives. US sites with scattered digital exports. Operadroom meets operators where their records actually live — and turns them into an agentic brain."
        />
        <UseCasesSection />
        <SecuritySection />
        <FullBleedBanner
          src="/images/energy-solar.jpg"
          label="Energy & Heavy Industry"
          title="Built for Assets That Cannot Fail"
          body="From refineries and chemical plants to upstream platforms and renewable infrastructure — Operadroom scales across any facility running predictive asset monitoring."
        />
        <PilotSection />
      </main>
      <Footer />
    </>
  );
}
