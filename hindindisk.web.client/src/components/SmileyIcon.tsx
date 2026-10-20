/**
 * The Danish Food Control "Smiley" mark — a green smiling face used to link to a
 * branch's findsmiley.dk profile.
 */
export function SmileyIcon({ size = 20, className = "shrink-0" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={className}>
      <circle cx="12" cy="12" r="10" fill="#22c55e" />
      <circle cx="8.5" cy="10" r="1.4" fill="#0f172a" />
      <circle cx="15.5" cy="10" r="1.4" fill="#0f172a" />
      <path d="M7 13 Q12 19 17 13" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
