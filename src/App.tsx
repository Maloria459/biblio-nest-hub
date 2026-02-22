import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AvatarProvider } from "./contexts/AvatarContext";
import { BooksProvider } from "./contexts/BooksContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Aventure from "./pages/Aventure";
import Lecture from "./pages/Lecture";
import Wishlist from "./pages/Wishlist";
import Communaute from "./pages/Communaute";
import Profil from "./pages/Profil";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <AvatarProvider>
      <BooksProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aventure" element={<Aventure />} />
            <Route path="/lecture" element={<Lecture />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/communaute" element={<Communaute />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/parametres" element={<Parametres />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BooksProvider>
    </AvatarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
