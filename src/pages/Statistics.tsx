import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart } from "@/components/RadarChart";
import welcomeBg from "@/assets/welcome-bg.jpg";

// Mock data for top games by genre
const topGamesByGenre = {
  RPG: [
    { 
      title: "The Witcher 3", 
      ratings: { jogabilidade: 9, graficos: 10, narrativa: 10, audio: 9, desempenho: 8 },
      cover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop"
    },
    { 
      title: "Elden Ring", 
      ratings: { jogabilidade: 10, graficos: 9, narrativa: 9, audio: 9, desempenho: 7 },
      cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop"
    },
    { 
      title: "Baldur's Gate 3", 
      ratings: { jogabilidade: 9, graficos: 9, narrativa: 10, audio: 8, desempenho: 8 },
      cover: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=400&fit=crop"
    },
  ],
  FPS: [
    { 
      title: "Doom Eternal", 
      ratings: { jogabilidade: 10, graficos: 9, narrativa: 7, audio: 10, desempenho: 9 },
      cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop"
    },
    { 
      title: "Titanfall 2", 
      ratings: { jogabilidade: 10, graficos: 8, narrativa: 8, audio: 9, desempenho: 9 },
      cover: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop"
    },
    { 
      title: "Halo Infinite", 
      ratings: { jogabilidade: 9, graficos: 9, narrativa: 7, audio: 9, desempenho: 8 },
      cover: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=400&fit=crop"
    },
  ],
  MOBA: [
    { 
      title: "Dota 2", 
      ratings: { jogabilidade: 9, graficos: 8, narrativa: 6, audio: 8, desempenho: 9 },
      cover: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop"
    },
    { 
      title: "League of Legends", 
      ratings: { jogabilidade: 9, graficos: 8, narrativa: 7, audio: 8, desempenho: 9 },
      cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop"
    },
    { 
      title: "Smite", 
      ratings: { jogabilidade: 8, graficos: 8, narrativa: 6, audio: 8, desempenho: 8 },
      cover: "https://images.unsplash.com/photo-1550751380-b659a1234e2c?w=400&h=400&fit=crop"
    },
  ],
  Soulslike: [
    { 
      title: "Dark Souls 3", 
      ratings: { jogabilidade: 10, graficos: 9, narrativa: 9, audio: 9, desempenho: 8 },
      cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop"
    },
    { 
      title: "Bloodborne", 
      ratings: { jogabilidade: 10, graficos: 9, narrativa: 10, audio: 10, desempenho: 7 },
      cover: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop"
    },
    { 
      title: "Sekiro", 
      ratings: { jogabilidade: 10, graficos: 9, narrativa: 9, audio: 9, desempenho: 9 },
      cover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop"
    },
  ],
};

// Mock data for best games by attribute
const bestByAttribute = {
  narrativa: [
    { title: "The Last of Us Part II", score: 10 },
    { title: "Red Dead Redemption 2", score: 10 },
    { title: "God of War", score: 10 },
  ],
  desempenho: [
    { title: "Doom Eternal", score: 10 },
    { title: "Forza Horizon 5", score: 10 },
    { title: "Valorant", score: 9 },
  ],
  audio: [
    { title: "Hellblade", score: 10 },
    { title: "The Last of Us", score: 10 },
    { title: "God of War", score: 10 },
  ],
  graficos: [
    { title: "Cyberpunk 2077", score: 10 },
    { title: "Red Dead Redemption 2", score: 10 },
    { title: "Horizon Forbidden West", score: 10 },
  ],
  jogabilidade: [
    { title: "Elden Ring", score: 10 },
    { title: "Sekiro", score: 10 },
    { title: "Doom Eternal", score: 10 },
  ],
};

export default function Statistics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative text-foreground p-6">
      {/* Full-screen Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${welcomeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-background/80" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-7xl mx-auto space-y-12">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tight font-pixel mb-2">
              Estatísticas Detalhadas
            </h1>
            <p className="text-muted-foreground">Análise completa das suas avaliações</p>
          </div>

          {/* Section 1 - Best by Genre */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel mb-8 text-center">
              Melhores por Gênero
            </h2>
            
            {Object.entries(topGamesByGenre).map(([genre, games]) => (
              <div key={genre} className="mb-12 last:mb-0">
                <h3 className="text-xl font-black text-primary/80 uppercase tracking-wider mb-6">
                  {genre}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {games.map((game, index) => (
                    <div 
                      key={index}
                      className="glass-panel rounded-xl border border-primary/20 p-6 hover:border-primary/40 transition-all relative overflow-hidden"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${game.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <RadarChart
                        data={game.ratings}
                        size={180}
                        showLabels={false}
                        title={game.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Section 2 - Best by Attribute */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel mb-8 text-center">
              Melhores por Atributo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(bestByAttribute).map(([attribute, games]) => (
                <div 
                  key={attribute}
                  className="glass-panel rounded-xl border border-primary/20 p-6"
                >
                  <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 text-center">
                    {attribute}
                  </h3>
                  <div className="space-y-3">
                    {games.map((game, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 glass-panel rounded-lg border border-primary/10"
                      >
                        <span className="text-sm text-foreground font-medium">{game.title}</span>
                        <span className="text-lg font-black text-primary">{game.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
