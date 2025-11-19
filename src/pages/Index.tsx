import { ProfileHeader } from "@/components/ProfileHeader";
import { NavigationMenu } from "@/components/NavigationMenu";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type GameSearchResult = {
  id: number;
  name: string;
  image: { 
    thumb_url: string | null;
    medium_url: string | null; 
  };
};

const RELEVANT_GAMES = [
  "Elden Ring",
  "Red Dead Redemption 2",
  "The Legend of Zelda: Breath of the Wild",
  "Minecraft",
  "The Last of Us Part II",
  "Sekiro: Shadows Die Twice",
  "Grand Theft Auto V",
  "Hollow Knight: Silksong"
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<GameSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("Visitante");
  const [isSearching, setIsSearching] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const response = await fetch(`/api/profile/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
            setUsername(data.username);
          } else {
            console.warn("Sessão inválida detectada. Realizando logout...");
            localStorage.clear();
            navigate("/");
          }
        } catch (error) {
          console.error("Erro ao carregar perfil na home:", error);
        }
      }
    };

    fetchUserData();
    loadRelevantGames();
  }, []);

  const loadRelevantGames = async () => {
    const cachedGames = localStorage.getItem("cached_popular_games");
    if (cachedGames) {
      setGames(JSON.parse(cachedGames));
      setLoading(false);
      return; 
    }

    setLoading(true);
    setIsSearching(false);
    const loadedGames: GameSearchResult[] = [];

    try {
      for (const gameName of RELEVANT_GAMES) {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(gameName)}`);
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            loadedGames.push(data[0]);
            setGames([...loadedGames]); 
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Erro ao carregar ${gameName}`, err);
        }
      }

      if (loadedGames.length > 0) {
        localStorage.setItem("cached_popular_games", JSON.stringify(loadedGames));
      }

    } catch (error) {
      console.error("Erro geral ao carregar jogos:", error);
      toast.error("Erro ao carregar lista de jogos.");
    } finally {
      setLoading(false);
    }
  };

  const searchGames = async (searchTerm: string) => {
    if (!searchTerm) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() === "") {
      setGames([]); 
      loadRelevantGames();
    } else {
      searchGames(query);
    }
  };

  const handleGameClick = (id: number) => {
    navigate(`/game/${id}`);
  };

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
            // CORREÇÃO AQUI: Removemos o link do Unsplash. Se for vazio, o componente usa o defaultprofile.png
            avatarUrl={userProfile?.avatar_url || ""} 
            bannerUrl={userProfile?.banner_url}
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
                  {loading ? "CARREGANDO..." : (isSearching ? "RESULTADOS DA BUSCA" : "JOGOS POPULARES")}
                </h2>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gaming-glow to-primary neon-glow" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {games.map((game) => (
                  <div 
                    key={game.id}
                    onClick={() => handleGameClick(game.id)}
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-black/40 transition-all hover:border-gaming-neon/50 hover:shadow-[0_0_30px_-5px_rgba(59,190,93,0.3)] cursor-pointer"
                  >
                    <div className="absolute inset-0">
                      {game.image?.medium_url ? (
                        <img
                          src={game.image.medium_url}
                          alt={game.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-800 text-gray-500">
                          Sem Imagem
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-60" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                      <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:text-gaming-neon transition-colors font-sans">
                        {game.name}
                      </h3>
                    </div>
                  </div>
                ))}
                
                {!loading && games.length === 0 && (
                  <p className="col-span-full text-center text-gray-500 py-10">
                    Nenhum jogo encontrado.
                  </p>
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