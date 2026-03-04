import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Heart,
  Users,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";

const mainMenuItems = [
  { title: "Mon tableau de bord", path: "/", icon: LayoutDashboard },
  { title: "Ma quête littéraire", path: "/aventure", icon: BookOpen },
  { title: "Mon coin lecture", path: "/lecture", icon: Library },
  { title: "Ma wishlist", path: "/wishlist", icon: Heart },
  { title: "Communauté", path: "/communaute", icon: Users },
  { title: "Paramètres", path: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { avatarUrl } = useAvatar();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-[var(--sidebar-width)] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center gap-2.5 px-6 border-b border-border">
        <BookOpen className="h-5 w-5 shrink-0 text-foreground" />
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          Biblio Nest
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {mainMenuItems.map((item) => {
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

      {/* Bottom section: Profil + Paramètres */}
      <div className="flex items-center justify-between border-t border-border px-3 h-[var(--bottombar-height)]">
          <RouterNavLink
            to="/profil"
            className={`flex flex-1 items-center gap-3 rounded-md px-3 h-9 text-sm font-medium transition-colors ${
              isActive("/profil")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Avatar className="h-5 w-5 shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Mon profil" />
              ) : null}
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span>Mon profil</span>
          </RouterNavLink>
          <button
            onClick={signOut}
            className="flex items-center justify-center rounded-md h-9 w-9 transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
      </div>
    </aside>
  );
}
