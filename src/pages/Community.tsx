import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, Trophy, Medal, Crown, MessageSquare, List, Heart, ExternalLink, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import defaultAvatar from "@/assets/defaultprofile.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Community() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]); 
  const [topUsers, setTopUsers] = useState<any[]>([]); 
  const [topComments, setTopComments] = useState<any[]>([]);
  const [topTierlists, setTopTierlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const topRes = await fetch('/api/users/top');
        if (topRes.ok) setTopUsers(await topRes.json());

        // Busca inicial de usuários (alfabética)
        setLoading(true);
        const searchRes = await fetch('/api/users/search');
        if (searchRes.ok) setUsers(await searchRes.json());
        
        // Busca Top Comentários
        const commentsRes = await fetch('/api/community/top_comments');
        if (commentsRes.ok) setTopComments(await commentsRes.json());
        
        // Busca Tierlists Populares
        const tierlistsRes = await fetch('/api/community/top_tierlists');
        if (tierlistsRes.ok) setTopTierlists(await tierlistsRes.json());
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Live Search para usuários
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const url = query.trim() 
        ? `/api/users/search?q=${encodeURIComponent(query)}` 
        : `/api/users/search`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setUsers(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleViewProfile = (userId: number) => {
    navigate(`/profile/${userId}`); 
  };

  const handleLikeTierlist = async (tierlistId: number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        toast.error("Faça login para curtir!");
        return;
    }

    try {
        const res = await fetch(`/api/tierlist/${tierlistId}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: parseInt(userId), tierlist_id: tierlistId })
        });

        if (res.ok) {
            const data = await res.json();
            // Atualiza a lista localmente para refletir a curtida imediatamente
            setTopTierlists(prev => prev.map(t => {
                if (t.id === tierlistId) {
                    return { ...t, likes: t.likes + (data.status === "liked" ? 1 : -1) };
                }
                return t;
            }));
        }
    } catch (e) { toast.error("Erro ao curtir."); }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-gray-500 font-pixel">#{index + 1}</span>;
  };

  const tierColors: Record<string, string> = {
      S: "bg-red-500", A: "bg-orange-500", B: "bg-yellow-500", C: "bg-green-500", D: "bg-blue-500"
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

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary uppercase tracking-tight font-pixel mb-2">
              Comunidade
            </h1>
            <p className="text-muted-foreground">Encontre outros jogadores, discussões e rankings</p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <div className="flex justify-center mb-8">
               <TabsList className="bg-black/60 border border-primary/20 p-1">
                  <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm">
                     <User className="w-4 h-4 mr-2" /> Jogadores
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm">
                     <MessageSquare className="w-4 h-4 mr-2" /> Top Comentários
                  </TabsTrigger>
                  <TabsTrigger value="tierlists" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm">
                     <List className="w-4 h-4 mr-2" /> Tierlists Populares
                  </TabsTrigger>
               </TabsList>
            </div>

            {/* ABA JOGADORES */}
            <TabsContent value="users">
              <div className="space-y-6">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="Digite para buscar um jogador..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 h-14 text-lg bg-black/40 border-primary/30 focus:border-primary text-white placeholder:text-gray-400 rounded-xl transition-all"
                    />
                </div>

                {!query.trim() && topUsers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" /> Ranking Global
                    </h2>
                    {topUsers.map((user, index) => (
                    <div 
                        key={user.id}
                        onClick={() => handleViewProfile(user.id)}
                        className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-yellow-500/50 transition-all cursor-pointer group bg-black/40"
                    >
                        <div className="w-10 flex justify-center">{getRankIcon(index)}</div>
                        <div className="relative">
                        <img 
                            src={user.avatar_url || defaultAvatar} 
                            alt={user.nickname} 
                            className={`w-14 h-14 rounded-full border-2 object-cover bg-black ${index === 0 ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-primary'}`}
                        />
                        </div>
                        <div className="flex-1">
                        <h3 className={`text-lg font-bold transition-colors ${index === 0 ? 'text-yellow-400' : 'text-white group-hover:text-primary'}`}>
                            {user.nickname || user.username}
                        </h3>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                        </div>
                        <div className="text-right mr-4">
                        <span className="block text-xs text-gray-500 uppercase tracking-wider">XP Total</span>
                        <span className="text-lg font-black text-white font-pixel">{user.xp}</span>
                        </div>
                    </div>
                    ))}
                </div>
                )}

                <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {query.trim() ? (
                    <>
                        <Search className="w-5 h-5 text-primary" /> Resultados da Busca
                        {loading && <span className="text-sm font-normal text-gray-500 ml-2 animate-pulse">(Buscando...)</span>}
                    </>
                    ) : (
                    <>
                        <User className="w-5 h-5 text-blue-400" /> Todos os Membros (A-Z)
                    </>
                    )}
                </h2>

                {loading && users.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 animate-pulse">Carregando lista...</div>
                ) : (
                    <>
                    {users.length > 0 ? (
                        users.map((user) => (
                        <div 
                            key={user.id}
                            onClick={() => handleViewProfile(user.id)}
                            className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer group bg-black/40"
                        >
                            <div className="relative">
                            <img 
                                src={user.avatar_url || defaultAvatar} 
                                alt={user.nickname} 
                                className="w-12 h-12 rounded-full border border-white/20 object-cover bg-black group-hover:border-primary"
                            />
                            </div>
                            <div className="flex-1">
                            <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                                {user.nickname || user.username}
                            </h3>
                            <p className="text-xs text-gray-400">@{user.username} • Lvl {user.level}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                            Ver Perfil
                            </Button>
                        </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                        {query.trim() ? "Nenhum usuário encontrado." : "Nenhum membro na comunidade ainda."}
                        </div>
                    )}
                    </>
                )}
                </div>
              </div>
            </TabsContent>

            {/* ABA TOP COMENTÁRIOS */}
            <TabsContent value="comments">
                <div className="space-y-4">
                    {topComments.map((comment) => (
                        <div key={comment.id} className="bg-[#1a1c1f] p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleViewProfile(comment.author.id)}>
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={comment.author.avatar_url || defaultAvatar} />
                                        <AvatarFallback>User</AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-white hover:text-primary">{comment.author.nickname}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400 bg-black/40 px-2 py-1 rounded text-xs">
                                    <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {comment.likes}
                                </div>
                            </div>
                            <p className="text-gray-300 italic mb-3 pl-4 border-l-2 border-primary/40">"{comment.content}"</p>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Gamepad2 className="w-3 h-3" />
                                    <span>Em: <strong className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/game/${comment.game_id}`)}>{comment.game_name}</strong></span>
                                </div>
                                <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {topComments.length === 0 && <div className="text-center py-10 text-gray-500">Nenhum comentário popular ainda.</div>}
                </div>
            </TabsContent>

            {/* ABA TIERLISTS POPULARES */}
            <TabsContent value="tierlists">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topTierlists.map((tier) => {
                        // Calcula distribuição de jogos
                        const totalGames = tier.data ? Object.values(tier.data).flat().length : 0;
                        
                        return (
                        <div key={tier.id} className="bg-[#1a1c1f] p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white truncate pr-2">{tier.name}</h3>
                                    <div className="flex items-center gap-1 text-gray-400 bg-black/40 px-2 py-1 rounded-full text-xs cursor-pointer hover:bg-white/10" onClick={() => handleLikeTierlist(tier.id)}>
                                        <Heart className="w-3 h-3 text-red-500" /> {tier.likes}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer hover:text-white" onClick={() => handleViewProfile(tier.author.id)}>
                                    <img src={tier.author.avatar_url || defaultAvatar} className="w-5 h-5 rounded-full" />
                                    <span>por {tier.author.nickname}</span>
                                </div>

                                {/* Mini Bar Chart da Tierlist */}
                                <div className="flex gap-0.5 h-1.5 w-full rounded-full overflow-hidden bg-black/50 mb-4">
                                    {Object.keys(tierColors).map(rank => {
                                        const count = tier.data && tier.data[rank] ? tier.data[rank].length : 0;
                                        if (count === 0) return null;
                                        return <div key={rank} className={`${tierColors[rank]} h-full`} style={{ flex: count }} />
                                    })}
                                </div>
                                <p className="text-[10px] text-gray-500 mb-4">{totalGames} jogos ranqueados</p>
                            </div>
                            
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => window.location.href = `/tierlist?load=${tier.id}`}
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Ver Tierlist
                            </Button>
                        </div>
                    )})}
                     {topTierlists.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Nenhuma tierlist popular ainda.</div>}
                </div>
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </div>
  );
}