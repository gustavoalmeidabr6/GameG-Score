import { ProfileHeader } from "@/components/ProfileHeader";
import { SearchBar } from "@/components/SearchBar";
import { NavigationMenu } from "@/components/NavigationMenu";
import { GameCard } from "@/components/GameCard";

import game1 from "@/assets/game1.jpg";
import game2 from "@/assets/game2.jpg";
import game3 from "@/assets/game3.jpg";
import game4 from "@/assets/game4.jpg";
import game5 from "@/assets/game5.jpg";
import game6 from "@/assets/game6.jpg";
import game7 from "@/assets/game7.jpg";
import game8 from "@/assets/game8.jpg";
import welcomeBg from "@/assets/welcome-bg.jpg";

const Index = () => {
  const games = [
    { id: 1, title: "STARFIGHTER'S CHRONICLE", image: game1 },
    { id: 2, title: "ELVEN LEGACY ONLINE", image: game2 },
    { id: 3, title: "IRONBOUND TALES", image: game3 },
    { id: 4, title: "NEBULA", image: game4 },
    { id: 5, title: "DUNGEON'S ASCENSION", image: game5 },
    { id: 6, title: "TITANFALL LEGENDS", image: game6 },
    { id: 7, title: "CELESTIAL REALMS", image: game7 },
    { id: 8, title: "ROGUE'S QUEST", image: game8 },
  ];

  return (
    <div className="min-h-screen relative pb-12">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
        {/* Profile Header */}
        <ProfileHeader
          username="NOME"
          level={10}
          rank="BRONZE II"
          avatarUrl="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop"
        />

        {/* Search and Menu */}
        <div className="flex items-center justify-between gap-4">
          <SearchBar />
          <NavigationMenu />
        </div>

        {/* Content Area - Darker Container for Search & Games */}
        <div className="relative rounded-2xl p-6 md:p-8 mt-8" style={{
          background: 'linear-gradient(180deg, #0A0A0A 0%, rgba(10, 10, 10, 0.95) 50%, rgba(10, 10, 10, 0.85) 100%)',
        }}>
          {/* Games Section */}
          <div className="space-y-6">
            {/* Section Header with tech styling */}
            <div className="relative inline-block">
              <h2 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-widest neon-text">
                JOGOS RELEVANTES
              </h2>
              {/* Underline accent */}
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gaming-glow to-primary neon-glow" />
              
              {/* Decorative corners */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
            </div>
            
            {/* Micro UI - Section info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                <span className="uppercase tracking-widest">{games.length} Jogos Disponíveis</span>
              </div>
              <span>•</span>
              <span className="uppercase tracking-widest">Atualizado Recentemente</span>
            </div>
            
            {/* Games Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} title={game.title} image={game.image} />
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Index;
