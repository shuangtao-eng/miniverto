export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="miniverto">
        <circle cx="13" cy="13" r="12" fill="var(--accent-bg)" />
        <circle cx="13" cy="13" r="3.5" fill="var(--accent)" />
        <ellipse cx="13" cy="13" rx="10" ry="4.5" stroke="var(--accent)" strokeWidth="1.2" fill="none" strokeDasharray="2 1.5" opacity="0.6" />
        <circle cx="22" cy="10" r="1.5" fill="var(--accent)" opacity="0.8" />
        <circle cx="5" cy="17" r="1" fill="var(--accent)" opacity="0.5" />
      </svg>
      {!collapsed && (
        <span className="font-display font-semibold text-[15px] text-foreground tracking-[-0.3px]">
          miniverto
        </span>
      )}
    </div>
  )
}
