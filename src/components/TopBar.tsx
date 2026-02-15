export const TOPBAR_RIGHT_ID = "topbar-right-slot";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center border-b border-border bg-card/80 backdrop-blur-sm px-6 overflow-visible">
      <div className="ml-auto" id={TOPBAR_RIGHT_ID} />
    </header>
  );
}
