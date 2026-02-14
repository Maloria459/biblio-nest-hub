interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center border-b border-border bg-card/80 backdrop-blur-sm px-6">
      <div className="flex items-baseline gap-2">
        <h1 className="font-display text-base font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          </>
        )}
      </div>
    </header>
  );
}
