import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      // --- MUDANÇA AQUI: Tirei 'http://127.0.0.1:8000' e deixei só '/api/...' ---
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("username", data.username);
        toast.success("Conta criada com sucesso!");
        navigate("/home");
      } else {
        toast.error(data.detail || "Erro ao criar conta");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#0A0A0A] text-white font-sans">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gaming-gradient opacity-40 z-10" />
        <img 
          src={loginBg} 
          alt="Gaming Setup" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-10 left-10 z-20 space-y-4">
          <h1 className="text-5xl font-black uppercase tracking-widest font-pixel text-white drop-shadow-[0_0_10px_rgba(59,190,93,0.5)]">
            Junte-se<br/>ao Squad
          </h1>
          <p className="text-xl text-gray-200 max-w-md font-medium">
            Crie sua conta e comece a construir seu legado gamer hoje mesmo.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gaming-glow/10 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight font-pixel">Criar Conta</h2>
            <p className="text-gray-400">Preencha seus dados para começar</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input 
                  id="username" 
                  placeholder="Seu nick gamer" 
                  required 
                  className="bg-white/5 border-white/10 focus:border-gaming-neon text-white placeholder:text-gray-500"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  className="bg-white/5 border-white/10 focus:border-gaming-neon text-white placeholder:text-gray-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="bg-white/5 border-white/10 focus:border-gaming-neon text-white"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  required 
                  className="bg-white/5 border-white/10 focus:border-gaming-neon text-white"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gaming-neon hover:bg-gaming-neon/90 text-black font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(59,190,93,0.4)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Criar Conta <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-400">Já tem uma conta? </span>
              <Link to="/login" className="font-bold text-gaming-neon hover:underline">
                Fazer Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;