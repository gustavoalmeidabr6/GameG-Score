import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, GripVertical, Save, Eye, Trash2 } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"library" | "creator" | "saved">("library");
  const [tierlistName, setTierlistName] = useState("");
  const [draggedGame, setDraggedGame] = useState<any>(null);
  
  // Estado da Tierlist Atual (Editor)
  const [tierGames, setTierGames] = useState<Record<string, any[]>>({
    S: [], A: [], B: [], C: [], D: [],
  });
  
  // Estados de Dados
  const [userGames, setUserGames] = useState<any[]>([]); // Todos os jogos avaliados
  const [poolGames, setPoolGames] = useState<any[]>([]); // Jogos disponíveis para arrastar
  const [savedTierlists, setSavedTierlists] = useState<any[]>([]); // Lista das salvas
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Carregar jogos avaliados pelo usuário (Biblioteca)
  useEffect(() => {
    const fetchUserGames = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/");
        return;
      }
      try {
        const response = await fetch(`/api/user_games/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUserGames(data);
          // Se o editor estiver vazio, enche o pool com todos os jogos
          if (Object.values(tierGames).flat().length === 0) {
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

  // 2. Carregar tierlists salvas quando entra na aba "saved"
  useEffect(() => {
    if (activeTab === "saved") {
      const fetchSaved = async () => {
        const userId = localStorage.getItem("userId");
        try {
          const response = await fetch(`/api/tierlists/${userId}`);
          if (response.ok) {
            setSavedTierlists(await response.json());
          }
        } catch (error) {
          toast.error("Erro ao carregar tierlists salvas.");
        }
      };
      fetchSaved();
    }
  }, [activeTab]);

  // --- LÓGICA DE ARRASTAR E SOLTAR (DRAG AND DROP) ---
  const handleDragStart = (game: any) => {
    setDraggedGame(game);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTier = (tier: string) => {
    if (!draggedGame) return;

    // Remove de onde estava (outra tier ou pool)
    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g: any) => g.id !== draggedGame.id);
    });
    setPoolGames(poolGames.filter((g) => g.id !== draggedGame.id));

    // Adiciona no novo destino
    newTierGames[tier] = [...newTierGames[tier], draggedGame];
    setTierGames(newTierGames);
    setDraggedGame(null);
  };

  const handleDropOnPool = () => {
    if (!draggedGame) return;

    // Remove de qualquer tier
    const newTierGames = { ...tierGames };
    Object.keys(newTierGames).forEach((key) => {
      newTierGames[key] = newTierGames[key].filter((g: any) => g.id !== draggedGame.id);
    });
    setTierGames(newTierGames);

    // Devolve pro pool se não estiver lá
    if (!poolGames.find((g) => g.id === draggedGame.id)) {
      setPoolGames([...poolGames, draggedGame]);
    }
    setDraggedGame(null);
  };
  // ---------------------------------------------------

  const handleSaveTierlist = async () => {
    if (!tierlistName.trim()) {
      toast.error("Dê um nome para sua Tierlist!");
      return;
    }
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/tierlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tierlistName,
          data: tierGames,
          owner_id: parseInt(userId)
        })
      });

      if (response.ok) {
        toast.success("Tierlist salva com sucesso!");
        setActiveTab("saved"); // Vai para a aba de salvos
      } else {
        toast.error("Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  // Função mágica: Carrega uma tierlist salva para o editor
  const loadTierlistToView = (tierlist: any) => {
    setTierlistName(tierlist.name);
    setTierGames(tierlist.data);
    
    // Calcula quais jogos NÃO estão na tierlist para colocar no pool
    const usedIds = new Set();
    Object.values(tierlist.data).forEach((list: any) => list.forEach((g: any) => usedIds.add(g.id)));
    setPoolGames(userGames.filter(g => !usedIds.has(g.id)));
    
    setActiveTab("creator");
    toast.info(`Editando: ${tierlist.name}`);
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
            <p className="text-muted-foreground">Crie e gerencie seus rankings</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 glass-panel">
              <TabsTrigger value="library">Jogos Avaliados</TabsTrigger>
              <TabsTrigger value="creator">Editor</TabsTrigger>
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
                    <div key={game.id} className="glass-panel rounded-lg overflow-hidden border border-primary/20 group">
                      <img src={game.cover} alt={game.title} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform" />
                      <div className="p-2 text-center">
                        <p className="text-xs font-bold truncate">{game.title}</p>
                      </div>
                    </div>
                  ))}
                  {userGames.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <p>Você ainda não avaliou nenhum jogo.</p>
                      <Button variant="link" onClick={() => navigate("/home")} className="text-[#3bbe5d]">Ir avaliar agora</Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: EDITOR (CRIAR TIERLIST) */}
            <TabsContent value="creator" className="space-y-6 mt-6">
              {/* Nome e Salvar */}
              <div className="glass-panel rounded-xl border-2 border-primary/30 p-6">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Nome da Tierlist (ex: Meus RPGs Favoritos)"
                    value={tierlistName}
                    onChange={(e) => setTierlistName(e.target.value)}
                    className="flex-1 bg-background/50 border-primary/20 focus:border-primary/50 font-medium text-white"
                  />
                  <Button 
                    onClick={handleSaveTierlist} 
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-black font-pixel text-xs uppercase tracking-wider"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>

              {/* Ranks (Área de Drop) */}
              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-6 space-y-4">
                {tierRanks.map((tier) => (
                  <div
                    key={tier.rank}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnTier(tier.rank)}
                    className={`relative min-h-[120px] rounded-xl border-2 border-primary/20 overflow-hidden transition-all hover:border-primary/40 ${
                      draggedGame ? 'bg-primary/5 border-dashed' : ''
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${tier.color} opacity-10`} />
                    <div className="relative flex gap-3 p-4">
                      <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center bg-black/20 rounded-lg">
                        <span className="text-3xl font-black text-primary uppercase font-pixel">{tier.rank}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{tier.label.split(' - ')[1]}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-3 items-center min-h-[80px]">
                        {tierGames[tier.rank].map((game: any) => (
                          <div
                            key={game.id}
                            draggable
                            onDragStart={() => handleDragStart(game)}
                            className="relative w-16 group cursor-move hover:scale-110 transition-transform"
                          >
                            <GripVertical className="absolute -top-1 -left-1 h-3 w-3 text-white opacity-0 group-hover:opacity-100 z-10 bg-black/50 rounded shadow-sm" />
                            <img src={game.cover} alt={game.title} className="w-full aspect-[3/4] object-cover rounded border border-white/20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pool de Jogos (Área de Origem) */}
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
                        className="w-full aspect-[3/4] object-cover rounded border-2 border-primary/20 hover:border-primary/50 transition-all"
                      />
                    </div>
                  ))}
                  {poolGames.length === 0 && tierGames['S'].length === 0 && (
                     <p className="text-sm text-gray-500 italic w-full text-center py-4">
                       Seus jogos avaliados aparecerão aqui.
                     </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: MINHAS TIERLISTS (SALVAS) */}
            <TabsContent value="saved" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTierlists.map((tierlist) => (
                  <div 
                    key={tierlist.id} 
                    className="glass-panel rounded-xl border-2 border-primary/20 p-6 flex flex-col justify-between group hover:border-primary/50 transition-all"
                  >
                    <div>
                      <h3 
                        onClick={() => loadTierlistToView(tierlist)}
                        className="text-xl font-bold text-white font-pixel mb-2 truncate cursor-pointer hover:text-[#3bbe5d] transition-colors"
                      >
                        {tierlist.name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">
                        {Object.values(tierlist.data).flat().length} jogos rankeados
                      </p>
                      
                      {/* Preview Miniatura dos Ranks */}
                      <div className="flex gap-1 mb-4 h-2 rounded-full overflow-hidden bg-black/40 w-full">
                        {tierRanks.map(t => {
                           const count = tierlist.data[t.rank]?.length || 0;
                           if (count === 0) return null;
                           return <div key={t.rank} className={`${t.barColor} h-full`} style={{ flex: count }} title={`${t.rank}: ${count}`} />
                        })}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary/10"
                      onClick={() => loadTierlistToView(tierlist)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Abrir / Editar
                    </Button>
                  </div>
                ))}
                {savedTierlists.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-black/40 rounded-xl p-8 border border-white/5 inline-block">
                        <p className="text-gray-500 mb-4">Você ainda não salvou nenhuma Tierlist.</p>
                        <Button variant="link" onClick={() => setActiveTab("creator")} className="text-[#3bbe5d]">
                            Criar minha primeira Tierlist
                        </Button>
                    </div>
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