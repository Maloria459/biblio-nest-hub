import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Heart,
  Users,
  User,
  Settings,
} from "lucide-react";

const menuItems = [
  { title: "Mon tableau de bord", path: "/", icon: LayoutDashboard },
  { title: "Mon aventure littéraire", path: "/aventure", icon: BookOpen },
  { title: "Mon coin lecture", path: "/lecture", icon: Library },
  { title: "Ma wishlist", path: "/wishlist", icon: Heart },
  { title: "Communauté", path: "/communaute", icon: Users },
  { title: "Mon profil", path: "/profil", icon: User },
  { title: "Paramètres", path: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-[var(--sidebar-width)] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center px-6 border-b border-border">
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          Biblio Nest
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <RouterNavLink
                  to={item.path}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </RouterNavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
