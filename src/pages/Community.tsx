import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, User, Trophy, Medal, Crown, MessageSquare, 
  List, Heart, ExternalLink, Gamepad2, ThumbsUp, ThumbsDown, 
  Plus, Send, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import defaultAvatar from "@/assets/defaultprofile.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function Community() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]); 
  const [topUsers, setTopUsers] = useState<any[]>([]); 
  const [topComments, setTopComments] = useState<any[]>([]);
  const [topTierlists, setTopTierlists] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]); // Estado para discussões
  const [loading, setLoading] = useState(false);

  // Estados para Criar Discussão
  const [newDiscOpen, setNewDiscOpen] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscContent, setNewDiscContent] = useState("");
  const [gameSearchQuery, setGameSearchQuery] = useState("");
  const [gameSearchResults, setGameSearchResults] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<{id: number, name: string} | null>(null);

  // Estados para Visualizar Discussão (Comentários)
  const [viewDisc, setViewDisc] = useState<any | null>(null);
  const [discComments, setDiscComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch paralelo para não travar
        const [topRes, searchRes, commentsRes, tierlistsRes, discRes] = await Promise.all([
            fetch('/api/users/top'),
            fetch('/api/users/search'),
            fetch('/api/community/top_comments'),
            fetch('/api/community/top_tierlists'),
            fetch('/api/discussions/top') // Nova rota
        ]);

        if (topRes.ok) setTopUsers(await topRes.json());
        if (searchRes.ok) setUsers(await searchRes.json());
        if (commentsRes.ok) setTopComments(await commentsRes.json());
        if (tierlistsRes.ok) setTopTierlists(await tierlistsRes.json());
        if (discRes.ok) setDiscussions(await discRes.json());
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Live Search Usuários
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const url = query.trim() 
        ? `/api/users/search?q=${encodeURIComponent(query)}` 
        : `/api/users/search`;

      fetch(url)
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(err => console.error(err));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Live Search Jogos (Para criar discussão)
  useEffect(() => {
    if (!gameSearchQuery.trim()) {
        setGameSearchResults([]);
        return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(gameSearchQuery)}`)
        .then(res => res.json())
        .then(data => setGameSearchResults(data))
        .catch(err => console.error(err));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [gameSearchQuery]);

  const handleViewProfile = (username: string) => navigate(`/profile/${username}`); 

  // --- LÓGICA DE DISCUSSÕES ---

  const handleCreateDiscussion = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return toast.error("Faça login para criar uma discussão.");
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return toast.error("Preencha título e conteúdo.");

    try {
        const res = await fetch("/api/discussions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newDiscTitle,
                content: newDiscContent,
                game_id: selectedGame?.id,
                game_name: selectedGame?.name,
                user_id: parseInt(userId)
            })
        });
        if (res.ok) {
            toast.success("Discussão criada!");
            setNewDiscOpen(false);
            setNewDiscTitle(""); setNewDiscContent(""); setSelectedGame(null);
            // Recarrega a lista
            const discRes = await fetch('/api/discussions/top');
            if (discRes.ok) setDiscussions(await discRes.json());
        } else {
            toast.error("Erro ao criar discussão.");
        }
    } catch (e) { toast.error("Erro de conexão."); }
  };

  const handleVote = async (e: React.MouseEvent, discId: number, type: number) => {
    e.stopPropagation();
    const userId = localStorage.getItem("userId");
    if (!userId) return toast.error("Faça login para votar.");

    try {
        const res = await fetch("/api/discussions/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: parseInt(userId), discussion_id: discId, vote_type: type })
        });
        
        if (res.ok) {
            // Atualização otimista da UI
            setDiscussions(prev => prev.map(d => {
                if (d.id === discId) {
                    // Lógica simplificada: Se eu der like, aumenta 1. Se der dislike, diminui 1.
                    // Num app real, checaríamos se o usuario ja tinha votado para ajustar corretamente (+2 ou -2 etc)
                    // Aqui vamos apenas incrementar/decrementar visualmente
                    return { ...d, score: d.score + type }; 
                }
                return d;
            }));
        }
    } catch (e) { toast.error("Erro ao votar."); }
  };

  const openDiscussionDetails = async (disc: any) => {
      setViewDisc(disc);
      // Carregar comentários
      const res = await fetch(`/api/discussions/${disc.id}/comments`);
      if (res.ok) setDiscComments(await res.json());
  };

  const handlePostComment = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return toast.error("Login necessário.");
      if (!newCommentText.trim()) return;

      try {
          const res = await fetch("/api/discussions/comment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  discussion_id: viewDisc.id,
                  user_id: parseInt(userId),
                  content: newCommentText
              })
          });
          if (res.ok) {
              setNewCommentText("");
              // Recarrega comentários
              const cRes = await fetch(`/api/discussions/${viewDisc.id}/comments`);
              if (cRes.ok) setDiscComments(await cRes.json());
              
              // Atualiza contador na lista principal
              setDiscussions(prev => prev.map(d => d.id === viewDisc.id ? {...d, comment_count: d.comment_count + 1} : d));
          }
      } catch(e) { toast.error("Erro ao comentar."); }
  };

  // --- LÓGICA DE TIERLISTS ---
  const handleLikeTierlist = async (e: React.MouseEvent, tierlistId: number) => {
    e.stopPropagation(); 
    const userId = localStorage.getItem("userId");
    if (!userId) return toast.error("Faça login para curtir!");

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
                  
                  {/* NOVA ABA DE DISCUSSÕES */}
                  <TabsTrigger value="discussions" className="text-xs md:text-sm gap-2">
                     <MessageSquare className="w-4 h-4" /> Discussões
                  </TabsTrigger>

                  <TabsTrigger value="tierlists" className="text-xs md:text-sm gap-2">
                     <List className="w-4 h-4" /> Tierlists
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs md:text-sm gap-2">
                     <Heart className="w-4 h-4" /> Comentários
                  </TabsTrigger>
               </TabsList>
            </div>

            {/* ABA JOGADORES (MANTIDA) */}
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

            {/* --- NOVA ABA: DISCUSSÕES --- */}
            <TabsContent value="discussions" className="animate-in fade-in slide-in-from-bottom-4">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Botão Criar */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white font-pixel tracking-wide">Fórum da Comunidade</h2>
                        <Dialog open={newDiscOpen} onOpenChange={setNewDiscOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-black font-bold hover:bg-primary/80">
                                    <Plus className="w-4 h-4 mr-2" /> Criar Discussão
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#121214] border border-white/10 text-white sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Nova Discussão</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <Input 
                                        placeholder="Título da discussão" 
                                        value={newDiscTitle}
                                        onChange={(e) => setNewDiscTitle(e.target.value)}
                                        className="bg-black/50 border-white/10"
                                    />
                                    
                                    {/* Busca de Jogo Simples */}
                                    <div className="relative">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Gamepad2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-400">Jogo Relacionado (Opcional)</span>
                                        </div>
                                        {!selectedGame ? (
                                            <div className="relative">
                                                <Input 
                                                    placeholder="Buscar jogo..." 
                                                    value={gameSearchQuery}
                                                    onChange={(e) => setGameSearchQuery(e.target.value)}
                                                    className="bg-black/50 border-white/10"
                                                />
                                                {gameSearchResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 bg-[#1A1A1A] border border-white/10 z-50 rounded-b-md max-h-40 overflow-y-auto">
                                                        {gameSearchResults.map(g => (
                                                            <div 
                                                                key={g.id}
                                                                className="p-2 hover:bg-white/10 cursor-pointer flex items-center gap-2"
                                                                onClick={() => {
                                                                    setSelectedGame({id: g.id, name: g.name});
                                                                    setGameSearchQuery("");
                                                                    setGameSearchResults([]);
                                                                }}
                                                            >
                                                                <img src={g.image?.thumb_url} className="w-6 h-6 rounded object-cover" />
                                                                <span className="text-xs truncate">{g.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded-md">
                                                <span className="text-sm font-bold text-primary">{selectedGame.name}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedGame(null)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Textarea 
                                        placeholder="O que você quer discutir?" 
                                        value={newDiscContent}
                                        onChange={(e) => setNewDiscContent(e.target.value)}
                                        className="bg-black/50 border-white/10 min-h-[150px]"
                                    />
                                    <Button onClick={handleCreateDiscussion} className="w-full bg-primary text-black font-bold">
                                        Publicar
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Lista de Discussões */}
                    <div className="space-y-4">
                        {discussions.map((disc) => (
                            <div key={disc.id} className="flex gap-4 bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                {/* Votos (Lateral Esquerda estilo Reddit) */}
                                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                    <button onClick={(e) => handleVote(e, disc.id, 1)} className="text-gray-500 hover:text-primary transition-colors">
                                        <ThumbsUp className="w-5 h-5" />
                                    </button>
                                    <span className={`font-bold text-sm ${disc.score > 0 ? 'text-primary' : disc.score < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {disc.score}
                                    </span>
                                    <button onClick={(e) => handleVote(e, disc.id, -1)} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <ThumbsDown className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 cursor-pointer" onClick={() => openDiscussionDetails(disc)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {disc.game_name && (
                                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                                                <Gamepad2 className="w-3 h-3 mr-1" /> {disc.game_name}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            Postado por <strong className="text-gray-300 hover:text-white" onClick={(e) => { e.stopPropagation(); handleViewProfile(disc.author.username); }}>{disc.author.nickname}</strong>
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 leading-tight">{disc.title}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                                        {disc.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1 hover:bg-white/5 px-2 py-1 rounded">
                                            <MessageSquare className="w-4 h-4" />
                                            {disc.comment_count} Comentários
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {discussions.length === 0 && (
                            <div className="text-center py-20 text-gray-500 bg-black/20 rounded-xl">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhuma discussão criada ainda. Seja o primeiro!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL DE DETALHES DA DISCUSSÃO */}
                <Dialog open={!!viewDisc} onOpenChange={(o) => !o && setViewDisc(null)}>
                    <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                        {viewDisc && (
                            <>
                                <DialogHeader className="p-6 pb-2 bg-[#121214] border-b border-white/5">
                                    {viewDisc.game_name && (
                                        <Badge className="w-fit mb-2 bg-primary/10 text-primary hover:bg-primary/20">{viewDisc.game_name}</Badge>
                                    )}
                                    <DialogTitle className="text-xl leading-tight">{viewDisc.title}</DialogTitle>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={viewDisc.author.avatar_url || defaultAvatar} />
                                        </Avatar>
                                        <span>{viewDisc.author.nickname}</span>
                                        <span>•</span>
                                        <span>{new Date(viewDisc.created_at).toLocaleDateString()}</span>
                                    </div>
                                </DialogHeader>
                                
                                <ScrollArea className="flex-1 p-6">
                                    <div className="text-gray-300 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                                        {viewDisc.content}
                                    </div>

                                    <div className="border-t border-white/10 pt-6">
                                        <h4 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" /> Comentários
                                        </h4>
                                        <div className="space-y-6">
                                            {discComments.map((c) => (
                                                <div key={c.id} className="flex gap-3">
                                                    <Avatar className="w-8 h-8 mt-1 border border-white/10 cursor-pointer" onClick={() => { setViewDisc(null); handleViewProfile(c.author.username); }}>
                                                        <AvatarImage src={c.author.avatar_url || defaultAvatar} />
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="bg-[#1A1A1A] p-3 rounded-lg rounded-tl-none border border-white/5">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-primary cursor-pointer" onClick={() => { setViewDisc(null); handleViewProfile(c.author.username); }}>{c.author.nickname}</span>
                                                                <span className="text-[10px] text-gray-600">{new Date(c.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-300">{c.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {discComments.length === 0 && <p className="text-xs text-gray-600 italic">Sem comentários.</p>}
                                        </div>
                                    </div>
                                </ScrollArea>

                                <div className="p-4 bg-[#121214] border-t border-white/10">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Escreva um comentário..." 
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                            className="bg-black border-white/10"
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                        />
                                        <Button size="icon" onClick={handlePostComment} className="bg-primary text-black">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* ABA TIERLISTS POPULARES (MANTIDA) */}
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

            {/* ABA TOP COMENTÁRIOS (MANTIDA) */}
            <TabsContent value="comments" className="animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                    {topComments.map((comment) => (
                        <div key={comment.id} className="glass-panel p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all bg-black/40">
                            <div className="flex justify-between items-start mb-3">
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