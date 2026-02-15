import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="relative flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
