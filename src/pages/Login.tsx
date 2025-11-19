import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- MUDANÇA AQUI: Usando rota relativa '/api/...' ---
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("username", data.username);
        toast.success("Login realizado com sucesso!");
        navigate("/home");
      } else {
        toast.error(data.detail || "Erro ao fazer login");
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
            Bem-vindo<br/>de volta
          </h1>
          <p className="text-xl text-gray-200 max-w-md font-medium">
            Sua jornada continua. Conecte-se para acessar suas estatísticas e conquistas.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gaming-glow/10 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight font-pixel">Login</h2>
            <p className="text-gray-400">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/forgot-password" className="text-sm text-gaming-neon hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="bg-white/5 border-white/10 focus:border-gaming-neon text-white"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                  Entrar <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-400">Não tem uma conta? </span>
              <Link to="/signup" className="font-bold text-gaming-neon hover:underline">
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;