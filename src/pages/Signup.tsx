import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import loginBg from "@/assets/login-bg.jpg";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    // Signup logic here - redirect to home
    console.log("Signup attempt:", { username, email, password });
    navigate("/home");
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-panel p-8 rounded-lg border-2 border-gaming-neon/40 bg-black/60 backdrop-blur-xl">
          {/* Title */}
          <h1 className="font-pixel text-3xl text-gaming-neon text-center mb-8 neon-text">
            Criar Conta
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="username" 
                className="text-foreground font-medium"
              >
                Nome de Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu nome de usuário"
                className="bg-black/30 border-0 border-b-2 border-gaming-neon/30 rounded-none focus:border-gaming-neon focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-2 py-3"
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-foreground font-medium"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                className="bg-black/30 border-0 border-b-2 border-gaming-neon/30 rounded-none focus:border-gaming-neon focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-2 py-3"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-foreground font-medium"
              >
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="confirmPassword" 
                className="text-foreground font-medium"
              >
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                className="bg-black/30 border-0 border-b-2 border-gaming-neon/30 rounded-none focus:border-gaming-neon focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-2 py-3"
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              className="w-full h-12 font-bold text-base transition-all shadow-lg shadow-gaming-neon/30"
              style={{ backgroundColor: '#3BBE5D', color: 'white' }}
            >
              Criar Conta
            </Button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center text-sm">
            <Link 
              to="/login" 
              className="block text-gaming-neon/70 hover:text-gaming-neon transition-colors"
            >
              Já tem uma conta? Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
