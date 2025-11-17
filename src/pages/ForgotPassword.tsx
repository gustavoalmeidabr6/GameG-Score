import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import loginBg from "@/assets/login-bg.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Password recovery logic here
    console.log("Password recovery for:", email);
    alert("Link de recuperação enviado para seu email!");
    navigate("/login");
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Forgot Password Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-panel p-8 rounded-lg border-2 border-gaming-neon/40 bg-black/60 backdrop-blur-xl">
          {/* Title */}
          <h1 className="font-pixel text-3xl text-gaming-neon text-center mb-4 neon-text">
            Esqueceu a Senha?
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Digite seu email para receber um link de recuperação
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Submit Button */}
            <Button 
              type="submit"
              className="w-full h-12 font-bold text-base transition-all shadow-lg shadow-gaming-neon/30"
              style={{ backgroundColor: '#3BBE5D', color: 'white' }}
            >
              Enviar Link de Recuperação
            </Button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 space-y-3 text-center text-sm">
            <Link 
              to="/login" 
              className="block text-gaming-neon/70 hover:text-gaming-neon transition-colors"
            >
              Voltar para Login
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

export default ForgotPassword;
