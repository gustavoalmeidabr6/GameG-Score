import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Save, Eye, Share2, Lock, Trash2, Copy, 
  MessageSquare, ThumbsUp, Send, Heart, GripVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import welcomeBg from "@/assets/welcome-bg.jpg";
import defaultAvatar from "@/assets/defaultprofile.png";

const tierRanks = [
  { rank: "S", label: "Obra-Prima", color: "bg-red-600", border: "border-red-500" },
  { rank: "A", label: "Excelente", color: "bg-orange-500", border: "border-orange-500" },
  { rank: "B", label: "Muito Bom", color: "bg-yellow-500", border: "border-yellow-500" },
  { rank: "C", label: "Mediano", color: "bg-green-500", border: "border-green-500" },
  { rank: "D", label: "Fraco", color: "bg-blue-500", border: "border-blue-500" },
];

export default function Tierlist() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); 
  const [activeTab, setActiveTab] = useState<"library" | "creator" | "saved">("library");
  
  // Dados Principais
  const [tierlistName, setTierlistName] = useState("");
  const [tierGames, setTierGames] = useState<Record<string, any[]>>({
    S: [], A: [], B: [], C: [], D: [],
  });
  
  // Estado de Visualização / Edição
  const [currentTierlistId, setCurrentTierlistId] = useState<number | null>(null);
  const [viewingMode, setViewingMode] = useState(false);
  const [viewingOwner, setViewingOwner] = useState<any>(null);
  
  // Dados Auxiliares
  const [userGames, setUserGames] = useState<any[]>([]); 
  const [poolGames, setPoolGames] = useState<any[]>([]); 
  const [savedTierlists, setSavedTierlists] = useState<any[]>([]); 
  const [draggedGame, setDraggedGame] = useState<any>(null);
  
  // Interações Sociais (Novo)
  const [likesCount, setLikesCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  // 1. Carregar da URL (?load=ID)
  useEffect(() => {
    const loadId = searchParams.get("load");
    if (loadId) {
      fetchPublicTierlist(loadId);
    }
  }, [searchParams]);

  const fetchPublicTierlist = async (id: string) => {
    try {
      const myId = localStorage.getItem("userId");
      // Passa o ID do usuário para saber se ele deu like
      const url = myId ? `/api/tierlist_public/${id}?user_id=${myId}` : `/api/tierlist_public/${id}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTierlistName(data.name);
        setTierGames(data.data);
        
        const isMine = myId && parseInt(myId) === data.owner_id;
        
        setViewingOwner(data.owner);
        setViewingMode(!isMine); 
        setLikesCount(data.likes_count || 0);
        setUserHasLiked(data.user_has_liked || false);
        setComments(data.comments || []);

        if (isMine) {
            setCurrentTierlistId(data.id);
        } else {
            setCurrentTierlistId(data.id); // Guardamos o ID mesmo se não for nossa, para comentar/curtir
        }
        
        // Recalcula pool se eu estiver editando minha própria
        if (isMine && userGames.length > 0) {
            const usedIds = new Set();
            Object.values(data.data).forEach((list: any) => list.forEach((g: any) => usedIds.add(g.id)));
            setPoolGames(userGames.filter(g => !usedIds.has(g.id)));
        }

        setActiveTab("creator"); 
      } else {
        toast.error("Tierlist não encontrada.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Carregar jogos do usuário
  useEffect(() => {
    const fetchUserGames = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        if (!searchParams.get("load")) navigate("/");
        return;
      }
      try {
        const response = await fetch(`/api/user_games/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUserGames(data);
          if (!searchParams.get("load") && Object.values(tierGames).flat().length === 0) {
             setPoolGames(data);
          }
        }
      } catch (error) { console.error(error); }
    };
    fetchUserGames();
  }, [navigate]);

  // 3. Carregar Minhas Tierlists Salvas
  const fetchSavedTierlists = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const response = await fetch(`/api/tierlists/${userId}`);
      if (response.ok) setSavedTierlists(await response.json());
    } catch (error) { toast.error("Erro ao carregar salvas."); }
  };

  useEffect(() => {
    if (activeTab === "saved") fetchSavedTierlists();
  }, [activeTab]);

  // --- DRAG AND DROP ---
  const handleDragStart = (game: any) => { if (!viewingMode || isMyTierlist()) setDraggedGame(game); };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDropOnTier = (tier: string) => {
    if (!draggedGame || (viewingMode && !isMyTierlist())) return;

    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g: any) => g.id !== draggedGame.id);
    });
    // Remove do pool apenas se estava no pool
    setPoolGames(prev => prev.filter((g) => g.id !== draggedGame.id));
    
    newTierGames[tier] = [...newTierGames[tier], draggedGame];
    setTierGames(newTierGames);
    setDraggedGame(null);
  };

  const handleDropOnPool = () => {
    if (!draggedGame || (viewingMode && !isMyTierlist())) return;
    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g: any) => g.id !== draggedGame.id);
    });
    setTierGames(newTierGames);
    if (!poolGames.find((g) => g.id === draggedGame.id)) {
      setPoolGames([...poolGames, draggedGame]);
    }
    setDraggedGame(null);
  };

  // --- AÇÕES ---
  const isMyTierlist = () => {
      const myId = localStorage.getItem("userId");
      return myId && viewingOwner && parseInt(myId) === viewingOwner.id;
  };

  const handleSaveTierlist = async (saveAsNew: boolean = false) => {
    if (viewingMode && !saveAsNew && !isMyTierlist()) {
      toast.info("Use 'Salvar Cópia' para salvar esta lista.");
      return;
    }
    if (!tierlistName.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsSaving(true);
    try {
      // Se eu sou o dono e não quero salvar como nova, é PUT.
      const isUpdate = currentTierlistId && !saveAsNew && (viewingMode ? isMyTierlist() : true);
      const method = isUpdate ? "PUT" : "POST";
      const url = isUpdate ? `/api/tierlist/${currentTierlistId}` : "/api/tierlist";

      const body = {
          name: tierlistName,
          data: tierGames,
          owner_id: parseInt(userId)
      };

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(saveAsNew ? "Cópia salva!" : "Tierlist salva!");
        if (saveAsNew) setActiveTab("saved");
      } else {
        toast.error("Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTierlist = async (id: number) => {
    if (!confirm("Excluir esta Tierlist?")) return;
    const userId = localStorage.getItem("userId");
    try {
        const res = await fetch(`/api/tierlist/${id}?owner_id=${userId}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Excluída.");
            setSavedTierlists(prev => prev.filter(t => t.id !== id));
        }
    } catch(e) { toast.error("Erro."); }
  };

  const handleLike = async () => {
      if (!currentTierlistId) return;
      const userId = localStorage.getItem("userId");
      if (!userId) { toast.error("Faça login."); return; }
      
      try {
          const res = await fetch(`/api/tierlist/${currentTierlistId}/like`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: parseInt(userId), tierlist_id: currentTierlistId })
          });
          if (res.ok) {
              const data = await res.json();
              if (data.status === "liked") {
                  setLikesCount(p => p + 1);
                  setUserHasLiked(true);
              } else {
                  setLikesCount(p => Math.max(0, p - 1));
                  setUserHasLiked(false);
              }
          }
      } catch (e) { toast.error("Erro ao curtir."); }
  };

  const handlePostComment = async () => {
      if (!newComment.trim() || !currentTierlistId) return;
      const userId = localStorage.getItem("userId");
      if (!userId) { toast.error("Faça login para comentar."); return; }

      try {
          const res = await fetch("/api/tierlist/comment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  tierlist_id: currentTierlistId,
                  user_id: parseInt(userId),
                  content: newComment
              })
          });

          if (res.ok) {
              toast.success("Comentário enviado!");
              setNewComment("");
              // Atualiza lista de comentários (simulação otimista ou refetch)
              // Vamos fazer um refetch rápido dos dados públicos para pegar o comentário formatado
              fetchPublicTierlist(currentTierlistId.toString());
          } else {
              toast.error("Erro ao enviar.");
          }
      } catch (e) { toast.error("Erro de conexão."); }
  };

  const loadTierlistToEdit = (tierlist: any) => {
    setTierlistName(tierlist.name);
    setTierGames(tierlist.data);
    setCurrentTierlistId(tierlist.id);
    setViewingMode(false); 
    setViewingOwner(null);
    setLikesCount(0); // Em modo de edição local, likes não importam tanto
    setComments([]);
    
    // Filtra pool
    const usedIds = new Set();
    Object.values(tierlist.data).forEach((list: any) => list.forEach((g: any) => usedIds.add(g.id)));
    setPoolGames(userGames.filter(g => !usedIds.has(g.id)));
    
    setActiveTab("creator");
  };

  const handleNewTierlist = () => {
    setTierlistName("");
    setTierGames({ S: [], A: [], B: [], C: [], D: [] });
    setPoolGames(userGames);
    setViewingMode(false);
    setViewingOwner(null);
    setCurrentTierlistId(null);
    setSearchParams({});
    setActiveTab("creator");
  };

  return (
    <div className="min-h-screen relative text-foreground p-4 md:p-8 font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-background/95">
        <div 
            className="absolute inset-0 opacity-20"
            style={{
            backgroundImage: `url(${welcomeBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)'
            }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:bg-primary/10">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <h1 className="text-3xl font-black text-primary font-pixel tracking-widest hidden md:block">TIERLISTS</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="bg-black/40 border border-primary/20 backdrop-blur-md">
                    <TabsTrigger value="library">Biblioteca de Jogos</TabsTrigger>
                    <TabsTrigger value="creator">
                        {viewingMode ? "Visualizar Tierlist" : "Criar / Editar"}
                    </TabsTrigger>
                    <TabsTrigger value="saved">Minhas Salvas</TabsTrigger>
                </TabsList>
            </div>

            {/* ABA: BIBLIOTECA */}
            <TabsContent value="library" className="animate-in fade-in slide-in-from-bottom-4">
              <div className="glass-panel p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary rounded-full"/> 
                    Seus Jogos Avaliados ({userGames.length})
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                  {userGames.map((game) => (
                    <div key={game.id} className="relative aspect-[3/4] group rounded-lg overflow-hidden border border-white/10 hover:border-primary transition-all">
                       <img src={game.cover} alt="" className="w-full h-full object-cover" />
                       <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 text-[10px] text-center font-bold truncate">
                           {game.title}
                       </div>
                       <div className="absolute top-1 right-1 bg-primary text-black text-xs font-bold px-1 rounded">
                           {game.nota_geral?.toFixed(1)}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ABA: CRIADOR / VISUALIZADOR */}
            <TabsContent value="creator" className="space-y-6">
                
                {/* 1. Header & Controles */}
                <div className="glass-panel p-6 rounded-xl border border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-black/40">
                    <div className="flex-1 w-full md:w-auto">
                        {viewingMode ? (
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight font-pixel mb-2">{tierlistName}</h2>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span>Criado por:</span>
                                    <div className="flex items-center gap-2 text-primary font-bold bg-white/5 px-2 py-1 rounded-full">
                                        <Avatar className="w-5 h-5">
                                            <AvatarImage src={viewingOwner?.avatar_url || defaultAvatar} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                        {viewingOwner?.nickname || viewingOwner?.username || "Desconhecido"}
                                    </div>
                                    <span className="text-xs text-gray-600 px-2">|</span>
                                    <div className="flex items-center gap-1 text-xs">
                                        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                                        {likesCount} curtidas
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 w-full">
                                <label className="text-xs text-primary uppercase font-bold ml-1">Nome da Tierlist</label>
                                <Input 
                                    value={tierlistName} 
                                    onChange={(e) => setTierlistName(e.target.value)}
                                    placeholder="Ex: Meus RPGs favoritos de 2024"
                                    className="text-lg font-bold bg-black/50 border-white/10 focus:border-primary h-12"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                         {viewingMode ? (
                             <>
                                <Button 
                                    onClick={handleLike} 
                                    variant={userHasLiked ? "default" : "outline"} 
                                    className={`gap-2 ${userHasLiked ? "bg-red-500 hover:bg-red-600 text-white border-none" : "border-primary/50 text-primary hover:bg-primary/10"}`}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${userHasLiked ? "fill-current" : ""}`} /> 
                                    {userHasLiked ? "Curtiu" : "Curtir"}
                                </Button>
                                <Button onClick={() => handleSaveTierlist(true)} variant="secondary" className="gap-2">
                                    <Copy className="w-4 h-4" /> Clonar
                                </Button>
                                <Button onClick={handleNewTierlist} variant="ghost">
                                    Limpar
                                </Button>
                             </>
                         ) : (
                             <>
                                <Button onClick={handleNewTierlist} variant="ghost" className="text-gray-400 hover:text-white">
                                    Limpar
                                </Button>
                                <Button onClick={() => handleSaveTierlist(false)} disabled={isSaving} className="bg-primary text-black font-bold hover:bg-primary/90 min-w-[120px]">
                                    <Save className="w-4 h-4 mr-2" /> 
                                    {isSaving ? "Salvando..." : "Salvar"}
                                </Button>
                             </>
                         )}
                    </div>
                </div>

                {/* 2. A Tierlist (Visual Rework) */}
                <div className="space-y-1 rounded-xl overflow-hidden border-2 border-white/5 bg-[#101010] shadow-2xl">
                    {tierRanks.map((tier) => (
                        <div key={tier.rank} className="flex min-h-[100px] bg-[#1a1a1a] border-b border-black/50 last:border-0 group">
                            {/* Label da Tier */}
                            <div className={`w-24 md:w-32 flex-shrink-0 flex items-center justify-center p-2 text-center ${tier.color} text-black`}>
                                <div>
                                    <span className="block text-2xl md:text-3xl font-black font-pixel">{tier.rank}</span>
                                    <span className="text-[10px] uppercase font-bold opacity-75">{tier.label}</span>
                                </div>
                            </div>
                            
                            {/* Área de Drop */}
                            <div 
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropOnTier(tier.rank)}
                                className={`flex-1 p-3 flex flex-wrap gap-2 transition-colors ${draggedGame ? 'bg-white/5 border-2 border-dashed border-white/20' : ''}`}
                            >
                                {tierGames[tier.rank].map((game: any) => (
                                    <div 
                                        key={game.id}
                                        draggable={!viewingMode || isMyTierlist()}
                                        onDragStart={() => handleDragStart(game)}
                                        className={`relative w-20 aspect-[3/4] group/game ${!viewingMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    >
                                        <img src={game.cover} className="w-full h-full object-cover rounded shadow-lg" />
                                        {!viewingMode && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/game:opacity-100 transition-opacity flex items-center justify-center">
                                                <GripVertical className="text-white w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-white p-0.5 truncate text-center">
                                            {game.title}
                                        </div>
                                    </div>
                                ))}
                                {tierGames[tier.rank].length === 0 && !draggedGame && (
                                    <div className="w-full h-full flex items-center justify-center text-white/10 text-sm italic select-none">
                                        Arraste jogos aqui
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Pool de Jogos (Só aparece se editando) */}
                {!viewingMode && (
                    <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDropOnPool}
                        className="glass-panel p-6 rounded-xl border-2 border-dashed border-white/20 bg-black/20"
                    >
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary" />
                             Jogos Disponíveis ({poolGames.length})
                        </h4>
                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {poolGames.map((game) => (
                                <div
                                    key={game.id}
                                    draggable
                                    onDragStart={() => handleDragStart(game)}
                                    className="w-16 md:w-20 aspect-[3/4] cursor-grab hover:scale-105 transition-transform relative"
                                >
                                    <img src={game.cover} className="w-full h-full object-cover rounded border border-white/10" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Seção de Comentários (Só aparece se visualizando uma Tierlist Salva) */}
                {currentTierlistId && (
                    <div className="glass-panel p-6 md:p-8 rounded-xl border border-white/10 mt-8 bg-black/40">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold text-white">Comentários da Comunidade ({comments.length})</h3>
                        </div>

                        {/* Input de Comentário */}
                        <div className="flex gap-4 mb-8">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarImage src={defaultAvatar} /> 
                                <AvatarFallback>EU</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <Textarea 
                                    placeholder="O que achou dessa Tierlist? (Seja respeitoso)" 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="bg-black/40 border-white/10 focus:border-primary min-h-[80px]"
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handlePostComment} className="bg-primary text-black hover:bg-primary/90 gap-2">
                                        <Send className="w-4 h-4" /> Enviar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Comentários */}
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 group">
                                    <Avatar className="w-10 h-10 cursor-pointer border border-transparent group-hover:border-primary transition-colors" onClick={() => navigate(`/profile/${comment.author.id}`)}>
                                        <AvatarImage src={comment.author.avatar_url || defaultAvatar} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(`/profile/${comment.author.id}`)}>
                                                {comment.author.nickname}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-tr-xl rounded-b-xl border border-white/5">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    Seja o primeiro a comentar nesta Tierlist!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </TabsContent>

            {/* ABA: MINHAS SALVAS */}
            <TabsContent value="saved">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTierlists.map((tierlist) => (
                  <div key={tierlist.id} className="glass-panel rounded-xl border border-white/10 p-5 flex flex-col justify-between group hover:border-primary/50 transition-all bg-black/60">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 
                                onClick={() => loadTierlistToEdit(tierlist)}
                                className="text-lg font-bold text-white font-pixel truncate cursor-pointer hover:text-primary transition-colors flex-1"
                            >
                                {tierlist.name}
                            </h3>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/tierlist?load=${tierlist.id}`);
                                        toast.success("Link copiado!");
                                    }}
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleDeleteTierlist(tierlist.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* Mini Visualização das Barras */}
                        <div className="flex gap-1 mb-4 h-3 rounded-full overflow-hidden bg-black/50 w-full">
                            {tierRanks.map(t => {
                                const count = tierlist.data[t.rank]?.length || 0;
                                if (count === 0) return null;
                                return <div key={t.rank} className={`${t.color} h-full`} style={{ flex: count }} title={`${count} jogos em ${t.rank}`} />
                            })}
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500 mb-4">
                            <span>{Object.values(tierlist.data).flat().length} jogos</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> Privado</span>
                        </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/30 text-primary hover:bg-primary hover:text-black font-bold"
                      onClick={() => loadTierlistToEdit(tierlist)}
                    >
                      Editar Tierlist
                    </Button>
                  </div>
                ))}
                {savedTierlists.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                        <p className="mb-4">Você ainda não criou nenhuma Tierlist.</p>
                        <Button onClick={() => setActiveTab("creator")} variant="secondary">Criar Minha Primeira</Button>
                    </div>
                )}
              </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}