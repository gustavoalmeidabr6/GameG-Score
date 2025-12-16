import { ProfileHeader } from "@/components/ProfileHeader";
import { NavigationMenu } from "@/components/NavigationMenu";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type GameSearchResult = {
  id: number;
  name: string;
  image: { 
    thumb_url: string | null;
    medium_url: string | null; 
  };
  average_score?: number;
  video_id?: string;
};

// --- COMPONENTE INTERNO PARA GERENCIAR O MOUSE OVER E VÍDEO ---
const GameCard = ({ game, onClick }: { game: GameSearchResult; onClick: (id: number) => void }) => {
  const [showVideo, setShowVideo] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (game.video_id) {
      timeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, 600);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowVideo(false);
  };

  return (
    <div 
      onClick={() => onClick(game.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-black/40 transition-all hover:border-gaming-neon/50 hover:shadow-[0_0_30px_-5px_rgba(59,190,93,0.3)] cursor-pointer"
    >
      <div className="absolute inset-0 overflow-hidden">
        {showVideo && game.video_id ? (
           <div className="absolute inset-0 z-10 bg-black animate-in fade-in duration-300 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 w-[350%] h-[150%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${game.video_id}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${game.video_id}`} 
                    title={game.name} 
                    className="w-full h-full object-cover opacity-80"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
              </div>
              <div className="absolute top-2 left-2 z-20 bg-gaming-neon/90 text-black text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md backdrop-blur-sm">
                 <PlayCircle className="w-3 h-3" /> PREVIEW
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
           </div>
        ) : (
           game.image?.medium_url ? (
            <img
              src={game.image.medium_url}
              alt={game.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-800 text-gray-500">
              Sem Imagem
            </div>
          )
        )}
        
        {!showVideo && game.average_score !== undefined && (
           <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-primary text-primary font-black text-sm px-2 py-1 rounded flex items-center gap-1 shadow-lg z-20">
              <Star className="w-3 h-3 fill-primary" />
              {game.average_score.toFixed(1)}
           </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-60 pointer-events-none" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform z-30">
        <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:text-gaming-neon transition-colors font-sans drop-shadow-md">
          {game.name}
        </h3>
      </div>
    </div>
  );
};

const Index = () => {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<GameSearchResult[]>([]);
  // Usei 'loadingGames' para diferenciar do carregamento inicial da página
  const [loadingGames, setLoadingGames] = useState(false); 
  const [username, setUsername] = useState("Visitante");
  const [isSearching, setIsSearching] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // ESTADO NOVO: Controla a tela preta inicial
  const [isInitializing, setIsInitializing] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const initializePage = async () => {
      // 1. Carregar Jogos (pode acontecer em paralelo, não bloqueamos o fetch)
      loadBestRatedGames();

      // 2. Verificar Usuário (Bloqueante)
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const response = await fetch(`/api/profile/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
            setUsername(data.username);
          } else {
            console.warn("Sessão inválida detectada.");
            localStorage.removeItem("userId");
          }
        } catch (error) {
          console.error("Erro ao carregar perfil na home:", error);
        }
      }
      
      // Remove a tela preta após tentar carregar o usuário
      setIsInitializing(false);
    };

    initializePage();
  }, []);

  const loadBestRatedGames = async () => {
    setLoadingGames(true);
    setIsSearching(false);

    try {
      const response = await fetch("/api/games/best-rated");
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
    } catch (error) {
      console.error("Erro geral ao carregar jogos:", error);
      toast.error("Erro ao carregar lista de jogos.");
    } finally {
      setLoadingGames(false);
    }
  };

  const searchGames = async (searchTerm: string) => {
    if (!searchTerm) return;
    setLoadingGames(true);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${searchTerm}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setGames(data);
      }
    } catch (error) {
      console.error("Erro ao buscar jogos:", error);
      toast.error("Falha na busca.");
    } finally {
      setLoadingGames(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() === "") {
      setGames([]); 
      loadBestRatedGames(); 
    } else {
      searchGames(query);
    }
  };

  const handleGameClick = (id: number) => {
    navigate(`/game/${id}`);
  };

  // Se estiver inicializando, mostra tela preta
  if (isInitializing) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen relative pb-12 font-sans">
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
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
          
          <ProfileHeader
            username={userProfile?.nickname || userProfile?.username || username}
            level={userProfile?.level || 1}
            rank={userProfile ? `XP: ${userProfile.xp}` : "INICIANTE"}
            xp={userProfile?.xp || 0}
            avatarUrl={userProfile?.avatar_url || ""} 
            bannerUrl={userProfile?.banner_url}
            bio={userProfile?.bio}
            followersCount={userProfile?.followers_count || 0} 
            // Corrigido a lógica de logout para não quebrar a página sem refresh
            onLogout={() => {
               localStorage.removeItem("userId");
               setUserProfile(null);
               setUsername("Visitante");
               navigate("/");
            }}
          />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar jogos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-black/40 border-gaming-neon/30 focus:border-gaming-neon text-white placeholder:text-gray-400"
              />
            </form>

            <NavigationMenu />
          </div>

          <div className="relative rounded-2xl p-6 md:p-8 mt-8" style={{
            background: 'linear-gradient(180deg, #0A0A0A 0%, rgba(10, 10, 10, 0.95) 50%, rgba(10, 10, 10, 0.85) 100%)',
          }}>
            <div className="space-y-6">
              <div className="relative inline-block">
                <h2 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-widest neon-text font-pixel">
                  {loadingGames ? "CARREGANDO..." : (isSearching ? "RESULTADOS DA BUSCA" : "MAIS BEM AVALIADOS")}
                </h2>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gaming-glow to-primary neon-glow" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {games.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onClick={handleGameClick} 
                  />
                ))}
                
                {!loadingGames && games.length === 0 && (
                  <div className="col-span-full text-center py-20">
                    <p className="text-gray-400 text-lg mb-2">
                       {isSearching ? "Nenhum jogo encontrado." : "Ainda não há avaliações na comunidade."}
                    </p>
                    {!isSearching && (
                        <p className="text-sm text-gray-600">Seja o primeiro a avaliar um jogo!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;