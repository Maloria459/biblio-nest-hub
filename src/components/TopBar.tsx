export const TOPBAR_RIGHT_ID = "topbar-right-slot";
export const TOPBAR_TITLE_ID = "topbar-title-slot";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center border-b border-border bg-card/80 backdrop-blur-sm px-6">
      <span id={TOPBAR_TITLE_ID} className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }} />
      <div className="ml-auto" id={TOPBAR_RIGHT_ID} />
    </header>
  );
}
