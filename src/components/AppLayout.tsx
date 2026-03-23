import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppLayout() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile drawer */}
      {isMobile && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
            <AppSidebar onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <main
        className={`relative flex-1 flex flex-col min-h-screen overflow-x-hidden ${
          isMobile ? "" : "ml-[var(--sidebar-width)]"
        }`}
      >
        {/* Mobile top bar with hamburger */}
        {isMobile && (
          <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-sm">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-accent transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-base font-bold tracking-tight text-foreground">
              Biblio Nest
            </span>
          </header>
        )}
        <Outlet />
      </main>
    </div>
  );
}
