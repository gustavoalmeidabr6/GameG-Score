import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, GripVertical, Save, Eye, Share2, Lock, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";

const tierRanks = [
  { rank: "S", label: "S - Obra-Prima", color: "from-red-500/80 to-orange-500/80", barColor: "bg-red-500" },
  { rank: "A", label: "A - Excelente", color: "from-orange-500/80 to-yellow-500/80", barColor: "bg-orange-500" },
  { rank: "B", label: "B - Bom", color: "from-yellow-500/80 to-primary/80", barColor: "bg-yellow-500" },
  { rank: "C", label: "C - Mediano", color: "from-primary/80 to-blue-500/80", barColor: "bg-green-500" },
  { rank: "D", label: "D - Fraco", color: "from-blue-500/80 to-gray-500/80", barColor: "bg-blue-500" },
];

export default function Tierlist() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); 
  const [activeTab, setActiveTab] = useState<"library" | "creator" | "saved">("library");
  const [tierlistName, setTierlistName] = useState("");
  const [draggedGame, setDraggedGame] = useState<any>(null);
  
  // Estado da Tierlist Atual (Editor)
  const [currentTierlistId, setCurrentTierlistId] = useState<number | null>(null); // ID da tierlist sendo editada
  const [tierGames, setTierGames] = useState<Record<string, any[]>>({
    S: [], A: [], B: [], C: [], D: [],
  });
  
  // Estados de Dados
  const [userGames, setUserGames] = useState<any[]>([]); 
  const [poolGames, setPoolGames] = useState<any[]>([]); 
  const [savedTierlists, setSavedTierlists] = useState<any[]>([]); 
  
  // Controle de visualização
  const [viewingMode, setViewingMode] = useState(false);
  const [viewingOwnerName, setViewingOwnerName] = useState("");
  
  const [loading, setLoading] = useState(true);
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
      const res = await fetch(`/api/tierlist_public/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTierlistName(data.name);
        setTierGames(data.data);
        
        const myId = localStorage.getItem("userId");
        const isMine = myId && parseInt(myId) === data.owner_id;
        
        setViewingOwnerName(data.owner_name);
        setViewingMode(!isMine); 

        if (isMine) {
            setCurrentTierlistId(data.id); // Se é minha, salvo o ID para permitir edição (PUT)
        } else {
            setCurrentTierlistId(null); // Se não é minha, não tenho ID para editar
        }
        
        // Recalcula o pool de jogos disponíveis (retira os que já estão na tierlist)
        if (userGames.length > 0) {
            const usedIds = new Set();
            Object.values(data.data).forEach((list: any) => list.forEach((g: any) => usedIds.add(g.id)));
            setPoolGames(userGames.filter(g => !usedIds.has(g.id)));
        }

        setActiveTab("creator"); 
        toast.success(`Carregada: ${data.name}`);
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
          // Só enche o pool se não estiver carregando uma tierlist específica
          if (!searchParams.get("load") && Object.values(tierGames).flat().length === 0) {
             setPoolGames(data);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar jogos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserGames();
  }, [navigate]);

  // 3. Carregar Salvas
  const fetchSavedTierlists = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const response = await fetch(`/api/tierlists/${userId}`);
      if (response.ok) {
        setSavedTierlists(await response.json());
      }
    } catch (error) {
      toast.error("Erro ao carregar tierlists salvas.");
    }
  };

  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedTierlists();
    }
  }, [activeTab]);

  // --- DRAG AND DROP ---
  const handleDragStart = (game: any) => {
    if (viewingMode) return;
    setDraggedGame(game);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTier = (tier: string) => {
    if (!draggedGame || viewingMode) return;

    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g: any) => g.id !== draggedGame.id);
    });
    setPoolGames(poolGames.filter((g) => g.id !== draggedGame.id));
    newTierGames[tier] = [...newTierGames[tier], draggedGame];
    setTierGames(newTierGames);
    setDraggedGame(null);
  };

  const handleDropOnPool = () => {
    if (!draggedGame || viewingMode) return;
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

  // --- SALVAR / EDITAR ---
  const handleSaveTierlist = async (saveAsNew: boolean = false) => {
    if (viewingMode && !saveAsNew) {
      toast.info("Você não pode editar a tierlist de outra pessoa. Use 'Salvar como Cópia'.");
      return;
    }
    if (!tierlistName.trim()) {
      toast.error("Dê um nome para sua Tierlist!");
      return;
    }
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsSaving(true);
    try {
      // Decide se é PUT (Atualizar) ou POST (Criar)
      const method = (currentTierlistId && !saveAsNew) ? "PUT" : "POST";
      // Se for PUT, usa a rota com ID. Se for POST, usa a rota base.
      const url = (currentTierlistId && !saveAsNew) 
        ? `/api/tierlist/${currentTierlistId}` 
        : "/api/tierlist";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tierlistName,
          data: tierGames,
          owner_id: parseInt(userId)
        })
      });

      if (response.ok) {
        toast.success(saveAsNew ? "Cópia salva com sucesso!" : "Tierlist atualizada!");
        setActiveTab("saved"); 
        handleNewTierlist(); // Limpa o editor após salvar
      } else {
        toast.error("Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- EXCLUIR ---
  const handleDeleteTierlist = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta Tierlist?")) return;
    
    const userId = localStorage.getItem("userId");
    try {
        const res = await fetch(`/api/tierlist/${id}?owner_id=${userId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            toast.success("Tierlist excluída.");
            setSavedTierlists(prev => prev.filter(t => t.id !== id));
        } else {
            toast.error("Erro ao excluir.");
        }
    } catch(e) {
        toast.error("Erro de conexão");
    }
  };

  const loadTierlistToView = (tierlist: any) => {
    setTierlistName(tierlist.name);
    setTierGames(tierlist.data);
    setCurrentTierlistId(tierlist.id); // IMPORTANTE: Define o ID para edição
    setViewingMode(false); 
    setViewingOwnerName("");
    
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
    setViewingOwnerName("");
    setCurrentTierlistId(null); // Reseta o ID
    setSearchParams({}); // Limpa a URL
    setActiveTab("creator");
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
            <p className="text-muted-foreground">Crie, compartilhe e visualize rankings</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 glass-panel">
              <TabsTrigger value="library">Jogos Avaliados</TabsTrigger>
              <TabsTrigger value="creator">
                 {viewingMode ? "Visualizador" : (currentTierlistId ? "Editando" : "Criador")}
              </TabsTrigger>
              <TabsTrigger value="saved">Minhas Tierlists</TabsTrigger>
            </TabsList>

            {/* ABA 1: BIBLIOTECA */}
            <TabsContent value="library" className="space-y-6 mt-6">
              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8">
                <h3 className="text-xl font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                  Sua Coleção ({userGames.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {userGames.map((game) => (
                    <div key={game.id} className="glass-panel rounded-lg overflow-hidden border border-primary/20 group relative">
                       <div className="absolute top-1 right-1 bg-black/80 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                          {game.nota_geral ? game.nota_geral.toFixed(1) : ""}
                       </div>
                      <img src={game.cover} alt={game.title} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform" />
                      <div className="p-2 text-center">
                        <p className="text-xs font-bold truncate">{game.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: EDITOR / VISUALIZADOR */}
            <TabsContent value="creator" className="space-y-6 mt-6">
              {/* Barra de Controle */}
              <div className="glass-panel rounded-xl border-2 border-primary/30 p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                   {viewingMode ? (
                     <div className="flex-1 flex items-center gap-2 text-white">
                        <Lock className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-400">De:</span>
                        <span className="font-bold text-primary text-lg">{viewingOwnerName}</span>
                        <span className="mx-2 text-gray-600">|</span>
                        <span className="font-bold italic">"{tierlistName}"</span>
                     </div>
                   ) : (
                      <Input
                        placeholder="Nome da Tierlist..."
                        value={tierlistName}
                        onChange={(e) => setTierlistName(e.target.value)}
                        className="flex-1 bg-background/50 border-primary/20 font-medium text-white"
                      />
                   )}
                  
                  <div className="flex gap-2">
                      {!viewingMode ? (
                        <>
                            {currentTierlistId && (
                                <Button 
                                    onClick={handleNewTierlist} 
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white"
                                >
                                    Cancelar Edição
                                </Button>
                            )}
                            <Button 
                            onClick={() => handleSaveTierlist(false)} 
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 text-black font-pixel text-xs uppercase"
                            >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Salvando..." : (currentTierlistId ? "Atualizar" : "Salvar")}
                            </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={handleNewTierlist} 
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          Criar Nova (Limpar)
                        </Button>
                      )}

                      {/* Botão de clonar ou salvar cópia */}
                      {(viewingMode || currentTierlistId) && (
                          <Button 
                             onClick={() => handleSaveTierlist(true)}
                             variant="secondary"
                             className="text-xs"
                             disabled={isSaving}
                          >
                             <Copy className="h-3 w-3 mr-2" /> Salvar Cópia
                          </Button>
                      )}
                  </div>
                </div>
              </div>

              {/* Ranks */}
              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-6 space-y-4">
                {tierRanks.map((tier) => (
                  <div
                    key={tier.rank}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnTier(tier.rank)}
                    className={`relative min-h-[120px] rounded-xl border-2 border-primary/20 overflow-hidden transition-all ${
                      draggedGame && !viewingMode ? 'bg-primary/5 border-dashed hover:border-primary/40' : ''
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${tier.color} opacity-10`} />
                    <div className="relative flex gap-3 p-4">
                      <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center bg-black/20 rounded-lg">
                        <span className="text-3xl font-black text-primary uppercase font-pixel">{tier.rank}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-3 items-center min-h-[80px]">
                        {tierGames[tier.rank].map((game: any) => (
                          <div
                            key={game.id}
                            draggable={!viewingMode}
                            onDragStart={() => handleDragStart(game)}
                            className={`relative w-16 group ${!viewingMode ? 'cursor-move hover:scale-110' : ''} transition-transform`}
                          >
                            <img src={game.cover} alt={game.title} className="w-full aspect-[3/4] object-cover rounded border border-white/20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pool de Jogos */}
              {!viewingMode && (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnPool}
                  className="glass-panel rounded-2xl border-2 border-primary/30 p-6"
                >
                  <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                    Disponíveis ({poolGames.length})
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {poolGames.map((game) => (
                      <div
                        key={game.id}
                        draggable
                        onDragStart={() => handleDragStart(game)}
                        className="w-20 cursor-move hover:scale-105 transition-transform"
                      >
                        <img
                          src={game.cover}
                          alt={game.title}
                          className="w-full aspect-[3/4] object-cover rounded border-2 border-primary/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 3: MINHAS TIERLISTS */}
            <TabsContent value="saved" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTierlists.map((tierlist) => (
                  <div key={tierlist.id} className="glass-panel rounded-xl border-2 border-primary/20 p-6 flex flex-col justify-between group hover:border-primary/50 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 
                                onClick={() => loadTierlistToView(tierlist)}
                                className="text-xl font-bold text-white font-pixel mb-2 truncate cursor-pointer hover:text-[#3bbe5d] transition-colors flex-1"
                            >
                                {tierlist.name}
                            </h3>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/tierlist?load=${tierlist.id}`);
                                    toast.success("Link copiado!");
                                    }}
                                    className="text-gray-400 hover:text-primary p-1.5 rounded hover:bg-white/5"
                                    title="Compartilhar"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteTierlist(tierlist.id)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-500/10"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-1 mb-4 h-2 rounded-full overflow-hidden bg-black/40 w-full">
                            {tierRanks.map(t => {
                                const count = tierlist.data[t.rank]?.length || 0;
                                if (count === 0) return null;
                                return <div key={t.rank} className={`${t.barColor} h-full`} style={{ flex: count }} />
                            })}
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-4">
                            {Object.values(tierlist.data).flat().length} jogos rankeados
                        </p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary/10"
                      onClick={() => loadTierlistToView(tierlist)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Editar
                    </Button>
                  </div>
                ))}
                {savedTierlists.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p>Nenhuma tierlist salva.</p>
                    </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}