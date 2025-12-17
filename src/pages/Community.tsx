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

        setLoading(true);
        const searchRes = await fetch('/api/users/search');
        if (searchRes.ok) setUsers(await searchRes.json());
        
        const commentsRes = await fetch('/api/community/top_comments');
        if (commentsRes.ok) setTopComments(await commentsRes.json());
        
        const tierlistsRes = await fetch('/api/community/top_tierlists');
        if (tierlistsRes.ok) setTopTierlists(await tierlistsRes.json());
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Live Search
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

  // ALTERAÇÃO AQUI: Agora recebe uma string (username) em vez de number (id)
  const handleViewProfile = (username: string) => navigate(`/profile/${username}`); 

  const handleLikeTierlist = async (e: React.MouseEvent, tierlistId: number) => {
    e.stopPropagation(); // Evita navegar ao clicar no like
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
      S: "bg-red-600", A: "bg-orange-500", B: "bg-yellow-500", C: "bg-green-500", D: "bg-blue-500"
  };

  return (
    <div className="min-h-screen relative text-foreground p-4 md:p-6 font-sans">
      <div 
        className="fixed inset-0 z-0 bg-background/95"
        style={{
          backgroundImage: `url(${welcomeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/80 to-transparent" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary uppercase tracking-tight font-pixel mb-2 drop-shadow-lg">
              Comunidade
            </h1>
            <p className="text-gray-400">Encontre jogadores, discussões e rankings</p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <div className="flex justify-center mb-8">
               <TabsList className="bg-black/60 border border-primary/20 p-1 backdrop-blur-md">
                  <TabsTrigger value="users" className="text-xs md:text-sm gap-2">
                     <User className="w-4 h-4" /> Jogadores
                  </TabsTrigger>
                  <TabsTrigger value="tierlists" className="text-xs md:text-sm gap-2">
                     <List className="w-4 h-4" /> Tierlists
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs md:text-sm gap-2">
                     <MessageSquare className="w-4 h-4" /> Comentários
                  </TabsTrigger>
               </TabsList>
            </div>

            {/* ABA JOGADORES */}
            <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <div className="relative w-full max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                        type="text"
                        placeholder="Buscar jogador..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-12 h-12 text-lg bg-black/60 border-white/10 focus:border-primary text-white rounded-full"
                    />
                </div>

                {!query.trim() && topUsers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                         <Trophy className="w-5 h-5 text-yellow-500" /> Top Jogadores (XP)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topUsers.map((user, index) => (
                        <div 
                            key={user.id}
                            // ALTERAÇÃO: Passando user.username
                            onClick={() => handleViewProfile(user.username)}
                            className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/5 hover:border-yellow-500/50 transition-all cursor-pointer bg-black/40"
                        >
                            <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
                            <Avatar className={`w-12 h-12 border-2 ${index === 0 ? 'border-yellow-500' : 'border-primary/50'}`}>
                                <AvatarImage src={user.avatar_url || defaultAvatar} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className={`font-bold ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>
                                    {user.nickname || user.username}
                                </h3>
                                <p className="text-xs text-gray-500">Lvl {user.level}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] text-gray-500 uppercase">XP Total</span>
                                <span className="text-sm font-black text-white font-pixel">{user.xp}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                        {query.trim() ? "Resultados" : "Todos os Membros"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {users.map((user) => (
                        <div 
                            key={user.id}
                            // ALTERAÇÃO: Passando user.username
                            onClick={() => handleViewProfile(user.username)}
                            className="flex items-center gap-3 p-3 glass-panel rounded-lg border border-white/5 hover:border-primary transition-all cursor-pointer bg-black/40"
                        >
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarImage src={user.avatar_url || defaultAvatar} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-white truncate">{user.nickname || user.username}</h3>
                                <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA TIERLISTS POPULARES */}
            <TabsContent value="tierlists" className="animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {topTierlists.map((tier) => {
                        const totalGames = tier.data ? Object.values(tier.data).flat().length : 0;
                        return (
                        <div key={tier.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-all flex flex-col justify-between bg-black/60 group">
                            <div>
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <h3 
                                        onClick={() => window.location.href = `/tierlist?load=${tier.id}`}
                                        className="font-bold text-lg text-white truncate cursor-pointer hover:text-primary transition-colors flex-1"
                                    >
                                        {tier.name}
                                    </h3>
                                    <button 
                                        className="flex items-center gap-1.5 text-gray-400 bg-white/5 px-2.5 py-1 rounded-full text-xs hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                        onClick={(e) => handleLikeTierlist(e, tier.id)}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${tier.likes > 0 ? "text-red-500 fill-red-500" : ""}`} /> 
                                        {tier.likes}
                                    </button>
                                </div>
                                
                                <div 
                                    className="flex items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer hover:text-white transition-colors"
                                    // ALTERAÇÃO: Passando tier.author.username
                                    onClick={() => handleViewProfile(tier.author.username)}
                                >
                                    <Avatar className="w-6 h-6 border border-white/10">
                                        <AvatarImage src={tier.author.avatar_url || defaultAvatar} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">por {tier.author.nickname}</span>
                                </div>

                                {/* Mini Bar Chart */}
                                <div className="flex gap-0.5 h-2 w-full rounded-full overflow-hidden bg-white/5 mb-3">
                                    {Object.keys(tierColors).map(rank => {
                                        const count = tier.data && tier.data[rank] ? tier.data[rank].length : 0;
                                        if (count === 0) return null;
                                        return <div key={rank} className={`${tierColors[rank]} h-full opacity-80`} style={{ flex: count }} />
                                    })}
                                </div>
                                <p className="text-[10px] text-gray-500 mb-4">{totalGames} jogos ranqueados</p>
                            </div>
                            
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full border-primary/30 text-primary hover:bg-primary hover:text-black font-bold"
                                onClick={() => window.location.href = `/tierlist?load=${tier.id}`}
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Visualizar
                            </Button>
                        </div>
                    )})}
                     {topTierlists.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Nenhuma tierlist popular ainda.</div>}
                </div>
            </TabsContent>

            {/* ABA TOP COMENTÁRIOS */}
            <TabsContent value="comments" className="animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                    {topComments.map((comment) => (
                        <div key={comment.id} className="glass-panel p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all bg-black/40">
                            <div className="flex justify-between items-start mb-3">
                                {/* ALTERAÇÃO: Passando comment.author.username */}
                                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleViewProfile(comment.author.username)}>
                                    <Avatar className="w-8 h-8 border border-white/10 group-hover:border-primary">
                                        <AvatarImage src={comment.author.avatar_url || defaultAvatar} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-white group-hover:text-primary transition-colors">{comment.author.nickname}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400 bg-white/5 px-2 py-1 rounded text-xs">
                                    <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {comment.likes}
                                </div>
                            </div>
                            
                            <div className="relative pl-4 border-l-2 border-primary/30 mb-4">
                                <p className="text-gray-300 italic">"{comment.content}"</p>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Gamepad2 className="w-3.5 h-3.5" />
                                    <span>Em: <strong className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/game/${comment.game_id}`)}>{comment.game_name}</strong></span>
                                </div>
                                <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {topComments.length === 0 && <div className="text-center py-10 text-gray-500">Nenhum comentário popular ainda.</div>}
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}