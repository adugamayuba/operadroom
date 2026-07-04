export function LogoMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 22C12.5 13 19.5 9 25 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 16H26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  );
}
