import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, Eye, BookOpen, Headphones, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/RatingInput";
import { CircularRating } from "@/components/CircularRating";
import welcomeBg from "@/assets/welcome-bg.jpg";

// Mock data - em produção viria de uma API ou estado global
const gameData = {
  title: "Cyberpunk 2077",
  cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
  synopsis: "Cyberpunk 2077 é um RPG de ação e aventura em mundo aberto que se passa em Night City, uma megalópole perigosa onde a obsessão por poder, glamour e modificações corporais é a norma. Você joga como V, um mercenário fora da lei em busca de um implante único que é a chave para a imortalidade.",
  ratings: {
    jogabilidade: 8,
    graficos: 9,
    narrativa: 9,
    audio: 9,
    desempenho: 8,
  }
};

export default function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ratings, setRatings] = useState(gameData.ratings);
  
  const averageRating = Math.round(
    ((ratings.jogabilidade + ratings.graficos + ratings.narrativa + ratings.audio + ratings.desempenho) / 5) * 10
  );

  const handleRatingChange = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

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

      {/* Main Container with Neon Border */}
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl border-2 border-primary/30 p-8 shadow-[0_0_30px_hsl(142_86%_50%/0.2)]">
        {/* Top Section: Cover + Info */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          {/* Game Cover */}
          <div className="relative">
            <img
              src={gameData.cover}
              alt={gameData.title}
              className="w-full rounded-lg border border-primary/20 shadow-lg"
            />
          </div>

          {/* Game Info */}
          <div className="flex flex-col justify-center">
            <h1 
              className="text-4xl md:text-5xl font-black text-primary mb-6 uppercase tracking-tight font-pixel leading-tight"
            >
              {gameData.title}
            </h1>
            <div className="mb-4">
              <span className="text-xs text-primary uppercase tracking-widest font-pixel">Description</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {gameData.synopsis}
            </p>
          </div>
        </div>

        {/* Rating Section */}
        <div className="border-t border-primary/20 pt-8">
          <h2 
            className="text-2xl font-black text-primary mb-8 uppercase tracking-wider text-center font-pixel"
          >
            Avaliação
          </h2>

          <div className="grid md:grid-cols-[2fr_1fr] gap-12 items-start">
            {/* Left Side - Individual Ratings with Icons and Sliders */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <RatingInput
                icon={Wrench}
                label="Jogabilidade"
                value={ratings.jogabilidade}
                onChange={(value) => handleRatingChange('jogabilidade', value)}
              />
              <RatingInput
                icon={Eye}
                label="Gráficos"
                value={ratings.graficos}
                onChange={(value) => handleRatingChange('graficos', value)}
              />
              <RatingInput
                icon={BookOpen}
                label="Narrativa"
                value={ratings.narrativa}
                onChange={(value) => handleRatingChange('narrativa', value)}
              />
              <RatingInput
                icon={Headphones}
                label="Áudio"
                value={ratings.audio}
                onChange={(value) => handleRatingChange('audio', value)}
              />
              <RatingInput
                icon={Gauge}
                label="Desempenho"
                value={ratings.desempenho}
                onChange={(value) => handleRatingChange('desempenho', value)}
              />
            </div>

            {/* Right Side - Average Rating */}
            <div className="flex flex-col items-center gap-6">
              <CircularRating 
                value={averageRating} 
                size="lg"
                showValue={true}
              />
              <span className="text-sm text-primary font-bold uppercase tracking-wider font-pixel">
                Average Rating
              </span>
              
              {/* Save Button */}
              <Button 
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-background font-pixel text-sm py-6 uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
              >
                Salvar Review
              </Button>
              <span className="text-xs text-muted-foreground">Review carregada.</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
