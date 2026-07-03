"use client";

import { useState } from "react";

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Security", href: "#security" },
  { label: "Pilot", href: "#pilot" },
];

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="ml-2">
      <path d="M1 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GhostButton({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex items-center px-6 py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-white/80 hover:bg-white hover:text-black transition-all duration-300";

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
        <ArrowIcon />
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
      <ArrowIcon />
    </button>
  );
}

function ImagePanel({
  src,
  alt = "",
  overlay = "dark",
  className = "",
}: {
  src: string;
  alt?: string;
  overlay?: "dark" | "light" | "none";
  className?: string;
}) {
  const overlayClass =
    overlay === "dark"
      ? "bg-gradient-to-t from-black/60 via-black/10 to-black/20"
      : overlay === "light"
        ? "bg-gradient-to-t from-black/40 via-transparent to-transparent"
        : "";

  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-black ${className}`}
      role="img"
      aria-label={alt}
    >
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-700 hover:scale-110"
        style={{ backgroundImage: `url('${src}')` }}
      />
      {overlay !== "none" && <div className={`absolute inset-0 ${overlayClass}`} />}
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
    <section className="relative min-h-[55vh] flex items-center border-t border-white/5 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${src}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-20 w-full">
        <p className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">{label}</p>
        <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold uppercase tracking-tight max-w-xl">
          {title}
        </h2>
        <p className="mt-5 text-[15px] text-white/60 max-w-lg leading-relaxed">{body}</p>
      </div>
    </section>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="text-[13px] font-semibold tracking-[0.35em] uppercase">
          Operadroom
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {NAV.map(({ label, href }) => (
            <a
              key={label}
              href={href}
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
              onClick={() => setOpen(false)}
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
    <section className="relative min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="hero-media absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/industrial-workers.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pb-24 pt-32 md:pb-32">
        <p className="text-[11px] tracking-[0.22em] uppercase text-white/50 mb-5 animate-fade-up">
          A Reelin AI Company
        </p>
        <h1 className="text-[clamp(2rem,5.5vw,4.25rem)] font-bold leading-[1.05] tracking-tight max-w-3xl uppercase animate-fade-up-delay">
          From Predictive Alert to Completed Work Order
        </h1>
        <p className="mt-6 text-[15px] md:text-[17px] text-white/65 max-w-xl leading-relaxed animate-fade-up-delay-2">
          Operadroom is the autonomous execution layer for industrial digital twins. When IoT
          flags a failure, our agents diagnose, cross-reference manuals, and draft maintenance
          workflows across your ERP — in seconds, not days.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up-delay-2">
          <GhostButton href="#pilot">Request Pilot</GhostButton>
          <GhostButton href="#platform">Explore Platform</GhostButton>
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
    <section id={id} className="min-h-[85vh] flex items-center border-t border-white/5">
      <div
        className={`max-w-[1400px] mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div>
          <p className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">{label}</p>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold uppercase leading-tight tracking-tight">
            {title}
          </h2>
          <p className="mt-6 text-[15px] md:text-[16px] text-white/60 leading-relaxed max-w-lg">
            {body}
          </p>
        </div>
        <div>{visual}</div>
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
          className="border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 transition-colors"
        >
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] tracking-[0.2em] text-white/35">{s.n}</span>
            <h3 className="text-[15px] font-semibold tracking-wide uppercase">{s.title}</h3>
          </div>
          <p className="mt-2 ml-10 text-[13px] text-white/50 leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

function ArchitectureVisual() {
  return (
    <div className="relative aspect-[4/3] border border-white/10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/images/data-network.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="relative z-10 h-full flex flex-col justify-center px-8 gap-4 text-[11px] tracking-wider uppercase">
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
      image: "/images/hero-offshore.jpg",
    },
  ];

  return (
    <section id="use-cases" className="border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 py-24">
        <p className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">Use Cases</p>
        <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold uppercase tracking-tight max-w-2xl">
          Bridging Digital Steel and Cognitive Execution
        </h2>
        <div className="mt-16 grid md:grid-cols-3 gap-px bg-white/10">
          {cases.map((c) => (
            <div key={c.title} className="bg-black group">
              <div className="relative h-44 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${c.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              </div>
              <div className="p-8 md:p-10">
                <h3 className="text-[14px] font-semibold tracking-wide uppercase">{c.title}</h3>
                <p className="mt-4 text-[14px] text-white/55 leading-relaxed">{c.desc}</p>
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
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/images/data-center.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/85" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24">
        <p className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">Security</p>
        <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold uppercase tracking-tight max-w-3xl">
          Enterprise-Grade Isolation. Your Data Never Trains Our Models.
        </h2>
        <p className="mt-6 text-[15px] text-white/55 max-w-2xl leading-relaxed">
          Operadroom integrates with your existing OT stack through approved APIs. We do not
          replace Siemens, SAP, or Cognite — we connect them with auditable autonomous agents.
        </p>
        <div className="mt-14 grid sm:grid-cols-2 gap-px bg-white/10">
          {items.map((item) => (
            <div key={item.title} className="bg-black/80 backdrop-blur-sm p-8 border border-white/5">
              <h3 className="text-[13px] font-semibold tracking-wide uppercase">{item.title}</h3>
              <p className="mt-3 text-[14px] text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PilotSection() {
  return (
    <section id="pilot" className="relative min-h-[70vh] flex items-center border-t border-white/5 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/oil-refinery.webp')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/55" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 w-full">
        <p className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">Pilot Program</p>
        <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold uppercase tracking-tight max-w-2xl">
          90-Day Facility Proof of Concept
        </h2>
        <p className="mt-6 text-[15px] text-white/60 max-w-xl leading-relaxed">
          Start at a single refinery, chemical plant, or upstream asset. Integrate with your
          digital twin data layer. Measure time from alert to draft work order. Scale regionally
          on proven ROI.
        </p>
        <p className="mt-4 text-[13px] text-white/40">
          Typical pilot scope: $150K–$300K · 3–6 months · 1 facility
        </p>
        <div className="mt-10">
          <a
            href="mailto:abel@reelin.ai?subject=Operadroom%20Pilot%20Inquiry"
            className="inline-flex items-center px-6 py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-white/80 hover:bg-white hover:text-black transition-all duration-300"
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
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.3em] uppercase">Operadroom</p>
          <p className="mt-2 text-[12px] text-white/40">A Reelin AI company</p>
        </div>
        <div className="flex flex-wrap gap-8 text-[11px] tracking-[0.14em] uppercase text-white/45">
          <a href="https://reelin.ai" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
            Reelin AI
          </a>
          <a href="mailto:abel@reelin.ai" className="hover:text-white transition-colors">
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
              className="aspect-[4/3]"
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
                className="aspect-[16/9]"
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
