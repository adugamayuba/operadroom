"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Use Cases", href: "#use-cases" },
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
          From Predictive Alert to Completed Work Order
        </h1>
        <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] md:text-[17px] text-white/65 max-w-xl leading-relaxed animate-fade-up-delay-2">
          Operadroom is the autonomous execution layer for industrial digital twins. When IoT
          flags a failure, our agents diagnose, cross-reference manuals, and draft maintenance
          workflows across your ERP — in seconds, not days.
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
    { n: "01", title: "Ingest", desc: "Real-time telemetry from digital twin & IoT streams" },
    { n: "02", title: "Diagnose", desc: "Parse manuals, history, and incident logs for root cause" },
    { n: "03", title: "Execute", desc: "Draft spec'd work orders across SAP, Maximo, and CMMS" },
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
        <div className="border border-white/15 px-4 py-3 text-white/70 bg-black/40">Digital Twin / IoT</div>
        <div className="text-center text-white/30">↓</div>
        <div className="border border-white/30 px-4 py-3 bg-white/[0.08] font-semibold">Operadroom Agent</div>
        <div className="text-center text-white/30">↓</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-white/15 px-3 py-2 text-white/50 bg-black/30">SAP / ERP</div>
          <div className="border border-white/15 px-3 py-2 text-white/50 bg-black/30">CMMS</div>
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
      title: "Closed-Loop Work Orders",
      desc: "Cut the hours between a predictive failure alert and a mobilized maintenance response.",
      image: "/images/machinery.jpg",
    },
    {
      title: "Institutional Memory",
      desc: "Preserve senior engineer decision logic before retirement. Query it against live asset data.",
      image: "/images/factory-floor.jpg",
    },
    {
      title: "Executive Decision Support",
      desc: "Run what-if scenarios on live telemetry. Deliver board-ready risk memos in minutes.",
      image: "/images/industrial-workers.jpg",
    },
  ];

  return (
    <section id="use-cases" className="border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">Use Cases</p>
        <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase tracking-tight max-w-2xl">
          Bridging Digital Steel and Cognitive Execution
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
      title: "Deployment Isolation",
      desc: "Cloud VPC, on-prem, or hybrid OT/IT zones. Your infrastructure, your rules.",
    },
    {
      title: "Data Sovereignty",
      desc: "Customer data never trains shared models. Read-only telemetry by default.",
    },
    {
      title: "Human-in-the-Loop",
      desc: "Agents draft actions. Engineers approve before any write operation executes.",
    },
    {
      title: "Reelin ID Audit Trail",
      desc: "Every agent action cryptographically tied to an authorized identity. Full compliance logs.",
    },
  ];

  return (
    <section id="security" className="relative border-t border-white/5 overflow-hidden">
      <KenBurnsBg src="/images/data-center.jpg" speed="slow" />
      <div className="absolute inset-0 bg-black/85 z-[1]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/45 mb-3 sm:mb-4">Security</p>
        <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase tracking-tight max-w-3xl">
          Enterprise-Grade Isolation. Your Data Never Trains Our Models.
        </h2>
        <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] text-white/55 max-w-2xl leading-relaxed">
          Operadroom integrates with your existing OT stack through approved APIs. We do not
          replace Siemens, SAP, or Cognite — we connect them with auditable autonomous agents.
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
          90-Day Facility Proof of Concept
        </h2>
        <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] text-white/60 max-w-xl leading-relaxed">
          Start at a single refinery, chemical plant, or upstream asset. Integrate with your
          digital twin data layer. Measure time from alert to draft work order. Scale regionally
          on proven ROI.
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
        <div className="flex flex-wrap gap-8 text-[11px] tracking-[0.14em] uppercase text-white/45">
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
          title="Digital Twins See Everything. Humans Still Move the Data."
          body="Industrial organizations have invested billions in real-time asset monitoring. When a sensor flags critical vibration or pressure drift, the alert is instant — but engineers still spend hours searching manuals, checking inventory, and filing tickets across siloed systems."
          visual={
            <ImagePanel
              src="/images/oil-refinery.webp"
              alt="Aerial view of an oil refinery complex"
              className="aspect-[4/5] sm:aspect-[16/11] lg:aspect-[5/4] w-full max-w-lg lg:ml-auto"
            />
          }
        />
        <SplitSection
          label="The Solution"
          title="Autonomous Agents Between Twin and ERP"
          body="Operadroom ports the same agent architecture proven in Swiftdroom — read, reason, act across platforms — onto industrial maintenance workflows. Predictive monitoring becomes closed-loop digital execution."
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
          label="Architecture"
          title="Integration, Not Replacement"
          body="Operadroom runs alongside Siemens, SAP, Aveva, Cognite, and IBM Maximo. We handle the connective tissue: translating live telemetry into spec'd maintenance actions with full audit trails via Reelin ID."
          visual={<ArchitectureVisual />}
        />
        <FullBleedBanner
          src="/images/iot-sensors.jpg"
          label="The Connective Layer"
          title="Digital Steel Meets Cognitive Execution"
          body="Industrial twins monitor physical assets. Operadroom agents move data between systems, parse engineering context, and execute workflows — closing the loop your dashboards leave open."
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
