import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import landingBg from "@/assets/landing-bg.png";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    "Avalie e Organize Seus Jogos Favoritos!",
    "Aprimore Seu Perfil Gamer com Estatísticas Detalhadas!",
    "Crie e Compartilhe Suas Tierlists Definitivas!",
    "Conecte-se com a Comunidade Gamer!"
  ];

  // --- NOVA LÓGICA: Verifica se já está logado ---
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      // Se tem ID salvo, manda direto para a Home
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${landingBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <img src={logo} alt="Score" className="h-10 md:h-14 lg:h-16" />
        </header>

        {/* Main Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="max-w-6xl w-full grid md:grid-cols-2 gap-10 items-center">
            
            {/* Left Side - Info */}
            <div className="space-y-8">
              <img src={logo} alt="Score" className="h-40 md:h-52 lg:h-64 mb-6" />
              
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="glass-panel p-5 rounded-xl border border-gaming-neon/30 hover:border-gaming-neon/60 transition-colors bg-black/60"
                  >
                    <p className="text-gaming-neon font-medium text-lg leading-snug">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Video & Actions */}
            <div className="space-y-8">
              
              {/* Video Player */}
              <div className="relative aspect-video bg-black/50 rounded-xl border-2 border-gaming-neon/50 overflow-hidden shadow-[0_0_40px_rgba(59,190,93,0.3)]">
                <video 
                  src="/videos/gameplay.mp4"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gaming-neon/5 pointer-events-none" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-5">
                <Link to="/signup" className="w-full">
                  <Button 
                    className="w-full h-16 
                    bg-[#3bbe5d] text-black font-bold text-xl 
                    border-none rounded-xl
                    shadow-[0_0_20px_rgba(59,190,93,0.4)] 
                    hover:bg-[#3bbe5d] hover:shadow-[0_0_30px_rgba(59,190,93,0.8)] hover:scale-[1.02]
                    transition-all duration-300"
                  >
                    Criar Conta
                  </Button>
                </Link>
                
                <Link to="/login" className="w-full">
                  <Button 
                    className="w-full h-14 
                    bg-[#3bbe5d] text-black font-bold text-lg 
                    border-none rounded-xl
                    shadow-[0_0_15px_rgba(59,190,93,0.4)] 
                    hover:bg-[#3bbe5d] hover:shadow-[0_0_25px_rgba(59,190,93,0.8)] hover:scale-[1.02]
                    transition-all duration-300"
                  >
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Landing;