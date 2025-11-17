import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import welcomeBg from "@/assets/welcome-bg.jpg";
import game1 from "@/assets/game1.jpg";
import game2 from "@/assets/game2.jpg";
import game3 from "@/assets/game3.jpg";
import game4 from "@/assets/game4.jpg";
import game5 from "@/assets/game5.jpg";
import game6 from "@/assets/game6.jpg";
import game7 from "@/assets/game7.jpg";
import game8 from "@/assets/game8.jpg";

// Mock game library data
const gameLibrary = {
  RPG: [
    { id: 1, title: "The Witcher 3", cover: game1 },
    { id: 2, title: "Elden Ring", cover: game2 },
    { id: 3, title: "Baldur's Gate 3", cover: game3 },
  ],
  FPS: [
    { id: 4, title: "Doom Eternal", cover: game4 },
    { id: 5, title: "Titanfall 2", cover: game5 },
  ],
  Aventura: [
    { id: 6, title: "The Last of Us", cover: game6 },
    { id: 7, title: "Uncharted 4", cover: game7 },
  ],
  Luta: [
    { id: 8, title: "Street Fighter 6", cover: game8 },
  ],
};

const tierRanks = [
  { rank: "S", label: "S - Obra-Prima", color: "from-red-500/80 to-orange-500/80" },
  { rank: "A", label: "A - Excelente", color: "from-orange-500/80 to-yellow-500/80" },
  { rank: "B", label: "B - Bom", color: "from-yellow-500/80 to-primary/80" },
  { rank: "C", label: "C - Mediano", color: "from-primary/80 to-blue-500/80" },
  { rank: "D", label: "D - Fraco", color: "from-blue-500/80 to-gray-500/80" },
];

export default function Tierlist() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"library" | "creator">("library");
  const [tierlistName, setTierlistName] = useState("");
  const [draggedGame, setDraggedGame] = useState<any>(null);
  const [tierGames, setTierGames] = useState<Record<string, any[]>>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });
  const [poolGames, setPoolGames] = useState<any[]>([
    ...gameLibrary.RPG,
    ...gameLibrary.FPS,
    ...gameLibrary.Aventura,
    ...gameLibrary.Luta,
  ]);

  const handleDragStart = (game: any) => {
    setDraggedGame(game);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTier = (tier: string) => {
    if (!draggedGame) return;

    // Remove from all tiers
    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g) => g.id !== draggedGame.id);
    });

    // Remove from pool
    setPoolGames(poolGames.filter((g) => g.id !== draggedGame.id));

    // Add to target tier
    newTierGames[tier] = [...newTierGames[tier], draggedGame];
    setTierGames(newTierGames);
    setDraggedGame(null);
  };

  const handleDropOnPool = () => {
    if (!draggedGame) return;

    // Remove from all tiers
    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g) => g.id !== draggedGame.id);
    });
    setTierGames(newTierGames);

    // Add back to pool if not already there
    if (!poolGames.find((g) => g.id === draggedGame.id)) {
      setPoolGames([...poolGames, draggedGame]);
    }
    setDraggedGame(null);
  };

  return (
    <div className="min-h-screen relative text-foreground p-6">
      {/* Background */}
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
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tight font-pixel mb-2">
              Tierlists
            </h1>
            <p className="text-muted-foreground">Organize seus jogos por ranking</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass-panel">
              <TabsTrigger value="library">Biblioteca</TabsTrigger>
              <TabsTrigger value="creator">Criar Tierlist</TabsTrigger>
            </TabsList>

            {/* Library Tab */}
            <TabsContent value="library" className="space-y-6 mt-6">
              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8">
                {Object.entries(gameLibrary).map(([genre, games]) => (
                  <div key={genre} className="mb-8 last:mb-0">
                    <h3 className="text-xl font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                      {genre}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {games.map((game) => (
                        <div
                          key={game.id}
                          className="glass-panel rounded-lg overflow-hidden border border-primary/20 hover:border-primary/40 transition-all hover:scale-105 cursor-pointer"
                        >
                          <img
                            src={game.cover}
                            alt={game.title}
                            className="w-full aspect-[3/4] object-cover"
                          />
                          <div className="p-2">
                            <p className="text-xs text-foreground font-medium truncate">{game.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Creator Tab */}
            <TabsContent value="creator" className="space-y-6 mt-6">
              {/* Tierlist Name Input */}
              <div className="glass-panel rounded-xl border-2 border-primary/30 p-6">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Nome da sua Tierlist (ex: Melhores RPGs de todos os tempos)"
                    value={tierlistName}
                    onChange={(e) => setTierlistName(e.target.value)}
                    className="flex-1 bg-background/50 border-primary/20 focus:border-primary/50 font-medium"
                  />
                  <Button className="bg-primary hover:bg-primary/90 text-background font-pixel text-xs uppercase tracking-wider">
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>

              {/* Tier Ranks */}
              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-6 space-y-4">
                <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                  Arraste os jogos para os ranks
                </h3>
                
                {tierRanks.map((tier) => (
                  <div
                    key={tier.rank}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnTier(tier.rank)}
                    className={`relative min-h-[120px] rounded-xl border-2 border-primary/20 overflow-hidden transition-all hover:border-primary/40 ${
                      draggedGame ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${tier.color} opacity-10`} />
                    
                    <div className="relative flex gap-3 p-4">
                      {/* Rank Label */}
                      <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-primary uppercase font-pixel">
                          {tier.rank}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          {tier.label.split(' - ')[1]}
                        </span>
                      </div>

                      {/* Games Container */}
                      <div className="flex-1 flex flex-wrap gap-3 items-center min-h-[80px]">
                        {tierGames[tier.rank].length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Arraste jogos aqui...</p>
                        ) : (
                          tierGames[tier.rank].map((game) => (
                            <div
                              key={game.id}
                              draggable
                              onDragStart={() => handleDragStart(game)}
                              className="relative w-16 group cursor-move"
                            >
                              <GripVertical className="absolute -top-1 -left-1 h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                              <img
                                src={game.cover}
                                alt={game.title}
                                className="w-full aspect-[3/4] object-cover rounded border-2 border-primary/30 group-hover:border-primary/60 transition-all"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Game Pool */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropOnPool}
                className="glass-panel rounded-2xl border-2 border-primary/30 p-6"
              >
                <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                  Jogos Disponíveis
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3">
                  {poolGames.map((game) => (
                    <div
                      key={game.id}
                      draggable
                      onDragStart={() => handleDragStart(game)}
                      className="cursor-move hover:scale-105 transition-transform"
                    >
                      <img
                        src={game.cover}
                        alt={game.title}
                        className="w-full aspect-[3/4] object-cover rounded border-2 border-primary/20 hover:border-primary/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
