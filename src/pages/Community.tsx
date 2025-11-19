import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, Trophy, Medal, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import defaultAvatar from "@/assets/defaultprofile.png";

export default function Community() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]); // Resultados da busca
  const [topUsers, setTopUsers] = useState<any[]>([]); // Top 10
  const [loading, setLoading] = useState(false);

  // Carrega o Top 10 assim que abrir a página
  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await fetch('/api/users/top');
        if (response.ok) {
          setTopUsers(await response.json());
        }
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
      }
    };
    fetchTopUsers();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Erro ao buscar usuários.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId: number) => {
    navigate(`/profile/${userId}`); 
  };

  // Helper para ícone de rank
  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-gray-500 font-pixel">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen relative text-foreground p-6 font-sans">
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
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary uppercase tracking-tight font-pixel mb-2">
              Comunidade
            </h1>
            <p className="text-muted-foreground">Encontre outros jogadores e veja o ranking global</p>
          </div>

          {/* Barra de Busca */}
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou nick..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === "") setUsers([]); // Limpa busca se apagar texto
              }}
              className="pl-12 h-14 text-lg bg-black/40 border-primary/30 focus:border-primary text-white placeholder:text-gray-400 rounded-xl"
            />
            <Button 
              type="submit" 
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-primary text-black font-bold hover:bg-primary/90"
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {/* CONTEÚDO: Busca OU Ranking */}
          <div className="space-y-4">
            
            {/* Título da Seção */}
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {query.trim() ? (
                <>
                  <Search className="w-5 h-5 text-primary" /> Resultados da Busca
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 text-yellow-400" /> Top 10 Melhores Jogadores
                </>
              )}
            </h2>

            {/* Lista de Busca */}
            {query.trim() && users.map((user) => (
              <div 
                key={user.id}
                onClick={() => handleViewProfile(user.id)}
                className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer group bg-black/40"
              >
                <div className="relative">
                   <img 
                     src={user.avatar_url || defaultAvatar} 
                     alt={user.nickname} 
                     className="w-16 h-16 rounded-full border-2 border-primary object-cover bg-black"
                   />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                    {user.nickname}
                  </h3>
                  <p className="text-sm text-gray-400">@{user.username} • Lvl {user.level}</p>
                </div>
                <Button variant="ghost" className="text-primary hover:bg-primary/10">
                  Ver Perfil <User className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ))}

            {/* Lista de Ranking (Só aparece se não estiver buscando) */}
            {!query.trim() && topUsers.map((user, index) => (
              <div 
                key={user.id}
                onClick={() => handleViewProfile(user.id)}
                className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-yellow-500/50 transition-all cursor-pointer group bg-black/40"
              >
                {/* Posição no Rank */}
                <div className="w-10 flex justify-center">
                  {getRankIcon(index)}
                </div>

                <div className="relative">
                   <img 
                     src={user.avatar_url || defaultAvatar} 
                     alt={user.nickname} 
                     className={`w-14 h-14 rounded-full border-2 object-cover bg-black ${index === 0 ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-primary'}`}
                   />
                </div>
                
                <div className="flex-1">
                  <h3 className={`text-lg font-bold transition-colors ${index === 0 ? 'text-yellow-400' : 'text-white group-hover:text-primary'}`}>
                    {user.nickname}
                  </h3>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>

                <div className="text-right mr-4">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider">XP Total</span>
                  <span className="text-lg font-black text-white font-pixel">{user.xp}</span>
                </div>
              </div>
            ))}

            {/* Mensagens de Vazio */}
            {!loading && query.trim() && users.length === 0 && (
              <div className="text-center py-10 text-gray-500">Nenhum usuário encontrado.</div>
            )}
            {!loading && !query.trim() && topUsers.length === 0 && (
              <div className="text-center py-10 text-gray-500">Ainda não há jogadores no ranking. Seja o primeiro!</div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}