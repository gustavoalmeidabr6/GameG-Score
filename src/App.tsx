import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import GameDetails from "./pages/GameDetails";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import Tierlist from "./pages/Tierlist";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute"; // <--- IMPORTAMOS O GUARDA

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* --- ROTAS PÚBLICAS (Qualquer um pode ver) --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* --- ROTAS PROTEGIDAS (O Guarda vigia estas) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Index />} />
            <Route path="/game/:id" element={<GameDetails />} />
            
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/tierlist" element={<Tierlist />} />
            <Route path="/community" element={<Community />} />
          </Route>
          
          {/* Rota de Erro 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;