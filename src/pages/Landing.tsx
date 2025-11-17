import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import landingBg from "@/assets/landing-bg.png";

const Landing = () => {
  const features = [
    "Avalie e Organize Seus Jogos Favoritos!",
    "Aprimore Seu Perfil Gamer com Estatísticas Detalhadas!",
    "Crie e Compartilhe Suas Tierlists Definitivas!",
    "Conecte-se com a Comunidade Gamer!"
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${landingBg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <img src={logo} alt="Score" className="h-16 md:h-24 lg:h-28" />
        </header>

        {/* Main Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-7xl w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
            <div className="space-y-8">
              <img src={logo} alt="Score" className="h-32 md:h-40 lg:h-48 mb-8" />
              
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="glass-panel p-4 rounded-lg border-2 border-gaming-neon/30 hover:border-gaming-neon/60 transition-colors"
                  >
                    <p className="text-gaming-neon font-medium text-sm md:text-base">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Video & Actions */}
            <div className="space-y-6">
              {/* Video Player - Autoplay Loop */}
              <div className="relative aspect-video bg-black/50 rounded-lg border-2 border-gaming-neon/50 overflow-hidden">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gaming-neon/5 pointer-events-none" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <Link to="/signup" className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full h-14 border-2 border-gaming-neon text-gaming-neon hover:bg-gaming-neon/10 font-bold text-lg transition-all"
                  >
                    Criar Conta
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-gaming-neon text-gaming-neon hover:bg-gaming-neon/10 font-semibold text-base transition-all"
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
