import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Aventure from "./pages/Aventure";
import Lecture from "./pages/Lecture";
import BookDetail from "./pages/BookDetail";
import Wishlist from "./pages/Wishlist";
import Communaute from "./pages/Communaute";
import Profil from "./pages/Profil";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aventure" element={<Aventure />} />
            <Route path="/lecture" element={<Lecture />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/communaute" element={<Communaute />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/parametres" element={<Parametres />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
