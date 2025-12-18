import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import loginBg from "@/assets/login-bg.jpg";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login realizado com sucesso!");
        
        // --- MUDANÇA PRINCIPAL AQUI ---
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("username", data.username);
        // Salvamos o TOKEN de segurança que o backend mandou
        localStorage.setItem("token", data.access_token); 
        
        navigate("/home"); 
      } else {
        toast.error(data.detail || "Email ou senha incorretos.");
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-black/80" />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-panel p-8 rounded-lg border-2 border-gaming-neon/40 bg-black/60 backdrop-blur-xl">
          <h1 className="font-pixel text-3xl text-gaming-neon text-center mb-8 neon-text">
            Fazer Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                className="bg-black/30 border-0 border-b-2 border-gaming-neon/30 rounded-none focus:border-gaming-neon focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-2 py-3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="bg-black/30 border-0 border-b-2 border-gaming-neon/30 rounded-none focus:border-gaming-neon focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-2 py-3"
                required
              />
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 font-bold text-base transition-all shadow-lg shadow-gaming-neon/30"
              style={{ backgroundColor: '#3BBE5D', color: 'white' }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <Link 
              to="/forgot-password" 
              className="block text-gaming-neon/70 hover:text-gaming-neon transition-colors"
            >
              Esqueceu a Senha?
            </Link>
            <Link 
              to="/signup" 
              className="block text-gaming-neon/70 hover:text-gaming-neon transition-colors"
            >
              Criar Nova Conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;