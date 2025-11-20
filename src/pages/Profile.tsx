import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom"; 
import { 
  ArrowLeft, Edit, TrendingUp, Star, Award, ExternalLink, 
  Trophy, Medal, Zap, Crown, Flame, Link as LinkIcon, Frown, 
  Gamepad2, List, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart } from "@/components/RadarChart";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import steamLogo from "@/assets/steam.png";
import xboxLogo from "@/assets/xbox.png";
import psnLogo from "@/assets/psn.png";
import epicLogo from "@/assets/epic.png";

const PLATFORMS = [
  { name: "Xbox", key: "xbox", icon: <img src={xboxLogo} alt="Xbox" className="w-6 h-6 object-contain" /> },
  { name: "Steam", key: "steam", icon: <img src={steamLogo} alt="Steam" className="w-6 h-6 object-contain" /> },
  { name: "Epic Games", key: "epic", icon: <img src={epicLogo} alt="Epic" className="w-6 h-6 object-contain" /> },
  { name: "PSN", key: "psn", icon: <img src={psnLogo} alt="PSN" className="w-6 h-6 object-contain" /> },
];

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams(); 
  const [profile, setProfile] = useState<any>(null);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [allTierlists, setAllTierlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false); 

  const fetchProfile = async () => {
    const loggedUserId = localStorage.getItem("userId");
    if (!loggedUserId) {
      navigate("/");
      return;
    }

    const targetId = userId || loggedUserId;
    setIsOwner(targetId === loggedUserId);

    try {
      // 1. Buscar dados principais do perfil
      const response = await fetch(`/api/profile/${targetId}`);
      if (response.status === 404) {
        toast.error("Usuário não encontrado.");
        navigate("/home");
        return;
      }
      const data = await response.json();
      if (response.ok) setProfile(data);

      // 2. Buscar todos os jogos avaliados (Biblioteca)
      const gamesRes = await fetch(`/api/user_games/${targetId}`);
      if (gamesRes.ok) {
        setAllGames(await gamesRes.json());
      }

      // 3. Buscar Tierlists
      const tierRes = await fetch(`/api/tierlists/${targetId}`);
      if (tierRes.ok) {
        setAllTierlists(await tierRes.json());
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate, userId]); 

  const openLink = (url: string) => {
    if (url) window.open(url, "_blank");
    else if (isOwner) setEditDialogOpen(true);
  };

  // Função para deletar Tierlist
  const handleDeleteTierlist = async (tierlistId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta Tierlist?")) return;

    const loggedUserId = localStorage.getItem("userId");
    try {
      const res = await fetch(`/api/tierlist/${tierlistId}?owner_id=${loggedUserId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("Tierlist excluída!");
        // Atualiza a lista localmente removendo a deletada
        setAllTierlists(prev => prev.filter(t => t.id !== tierlistId));
      } else {
        const err = await res.json();
        toast.error(err.detail || "Erro ao excluir");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    }
  };

  if (loading || !profile) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;

  const userAverage = profile.top_favorites?.length > 0
    ? (profile.top_favorites.reduce((acc: any, curr: any) => acc + curr.nota_geral, 0) / profile.top_favorites.length).toFixed(1)
    : "0.0";

  const ACHIEVEMENTS_LIST = [
    { key: "first_review", title: "Primeiros Passos", desc: "Avalie o primeiro jogo", icon: <Star className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "five_reviews", title: "Crítico em Ascensão", desc: "Avalie 5 jogos", icon: <TrendingUp className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "ten_reviews", title: "Crítico de Elite", desc: "Avalie 10 jogos", icon: <Medal className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "fps_king", title: "Rei do FPS", desc: "Avaliou mais de 20 jogos de Tiro", icon: <Flame className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "high_score", title: "Nota Máxima", desc: "Dê nota 10 em uma categoria", icon: <Zap className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "perfect_game", title: "Perfeccionista", desc: "Defina um jogo como perfeito (10 em tudo)", icon: <Crown className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "hater", title: "Exigente", desc: "Deu uma nota geral menor que 3", icon: <Frown className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "connected", title: "Conectado", desc: "Adicionou uma rede social", icon: <LinkIcon className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "veteran", title: "Veterano", desc: "Chegou ao nível 5", icon: <Trophy className="w-6 h-6 text-[#3bbe5d]" /> },
  ];

  const unlockedAchievements = ACHIEVEMENTS_LIST.filter(ach => profile.achievements && profile.achievements[ach.key]);
  
  const attributeLabels: Record<string, string> = {
    jogabilidade: "Jogabilidade",
    graficos: "Gráficos",
    narrativa: "Narrativa",
    audio: "Áudio",
    desempenho: "Desempenho",
  };

  return (
    <div className="min-h-screen relative text-white p-6 font-sans">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${welcomeBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/80" />
      </div>
      
      <div className="relative z-10">
        <Button variant="ghost" onClick={() => navigate("/home")} className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <div className="max-w-7xl mx-auto space-y-6">
          
          <ProfileHeader 
             username={profile.nickname || profile.username} 
             level={profile.level}
             rank={`XP: ${profile.xp}`} 
             avatarUrl={profile.avatar_url}
             bannerUrl={profile.banner_url}
             xp={profile.xp}
          />

           <div className="text-center -mt-12 mb-4 relative z-10 flex flex-col items-center gap-2">
              {profile.nickname && profile.nickname !== profile.username && (
                <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">@{profile.username}</span>
              )}
              <p className="text-gray-300 text-sm max-w-lg mx-auto bg-black/60 backdrop-blur-sm py-2 px-6 rounded-full border border-primary/30 italic shadow-lg">
                "{profile.bio || "Insira sua bio"}"
              </p>
           </div>
          
           {isOwner && (
             <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="border-primary text-primary h-8 text-xs">
                    <Edit className="mr-2 h-3 w-3" /> Editar Perfil
                </Button>
             </div>
           )}

          {/* ÁREA DE ABAS */}
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-black/60 border border-primary/20 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black px-6">
                   <Award className="w-4 h-4 mr-2" /> Visão Geral
                </TabsTrigger>
                <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-black px-6">
                   <Gamepad2 className="w-4 h-4 mr-2" /> Biblioteca ({allGames.length})
                </TabsTrigger>
                <TabsTrigger value="tierlists" className="data-[state=active]:bg-primary data-[state=active]:text-black px-6">
                   <List className="w-4 h-4 mr-2" /> Tierlists ({allTierlists.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTEÚDO: VISÃO GERAL (O que já existia) */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              
              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60">
                <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8 text-center font-pixel">
                  {isOwner ? "Meus Top 3 Jogos" : `Top 3 de ${profile.nickname || profile.username}`}
                </h2>
                {profile.top_favorites && profile.top_favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {profile.top_favorites.map((game: any, index: number) => (
                      <div key={index} className="rounded-xl border border-primary/20 p-6 relative overflow-hidden group h-[400px] flex flex-col justify-between">
                        <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500" style={{ backgroundImage: `url(${game.game_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                        <div className="relative z-10 flex flex-col items-center h-full">
                          <h3 className="text-lg font-bold text-white text-center mb-4 font-pixel truncate w-full px-2">{game.game_name}</h3>
                          <div className="flex-grow flex items-center justify-center w-full">
                             <RadarChart data={{ jogabilidade: game.jogabilidade, graficos: game.graficos, narrativa: game.narrativa, audio: game.audio, desempenho: game.desempenho }} size={180} showLabels={true} />
                          </div>
                          <div className="mt-4 bg-primary/20 px-4 py-2 rounded-full border border-primary/50">
                             <span className="text-xl font-black text-primary font-pixel">{game.nota_geral.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">Nenhum jogo avaliado ainda.</div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                 <div className="md:col-span-1 glass-panel rounded-xl border border-primary/20 p-6 bg-black/60">
                  <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">Plataformas</h2>
                  <div className="space-y-3">
                    {PLATFORMS.map((platform) => {
                      const hasLink = profile.social && profile.social[platform.key] && profile.social[platform.key].length > 0;
                      const url = hasLink ? profile.social[platform.key] : "";

                      return (
                        <div key={platform.key} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-black/40 rounded p-1">
                              {platform.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-200">{platform.name}</span>
                          </div>
                          
                          {hasLink ? (
                            <Button onClick={() => openLink(url)} variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:bg-primary/20">
                              <ExternalLink className="w-3 h-3 mr-1" /> Visitar
                            </Button>
                          ) : (
                            isOwner ? (
                              <Button onClick={() => setEditDialogOpen(true)} variant="ghost" size="sm" className="h-6 text-[10px] text-gray-400 hover:text-white">
                                Adicionar
                              </Button>
                            ) : <span className="text-[10px] text-gray-600">N/A</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2 glass-panel rounded-xl border border-primary/20 p-6 bg-black/60">
                  <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">Estatísticas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center">
                      <TrendingUp className="h-6 w-6 text-primary mb-2" />
                      <p className="text-3xl font-black text-white font-pixel">{profile.stats.reviews_count}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Jogos Avaliados</p>
                    </div>
                    <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center">
                      <Star className="h-6 w-6 text-primary mb-2" />
                      <p className="text-3xl font-black text-white font-pixel">{userAverage}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Média Geral</p>
                    </div>
                     <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center">
                      <Award className="h-6 w-6 text-primary mb-2" />
                      <p className="text-xl font-bold text-white font-pixel mt-1 truncate px-2 w-full">
                        {profile.stats.favorite_genre || "Nenhum"}
                      </p>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Gênero Favorito</p>
                    </div>
                  </div>
                </div>
              </div>

               <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60">
                <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel mb-8 text-center">
                  Melhores por Atributo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.best_by_attribute && Object.entries(profile.best_by_attribute).map(([attribute, games]: [string, any]) => {
                    if (games.length === 0) return null;
                    return (
                      <div key={attribute} className="glass-panel rounded-xl border border-primary/20 p-6 bg-white/5">
                        <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 text-center">
                          {attributeLabels[attribute] || attribute}
                        </h3>
                        <div className="space-y-3">
                          {games.map((game: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 glass-panel rounded-lg border border-primary/10 bg-black/40">
                              <span className="text-sm text-gray-200 font-medium truncate mr-2 w-2/3">{game.title}</span>
                              <span className="text-lg font-black text-primary">{game.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60">
                <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8 text-center font-pixel">
                  <Trophy className="inline-block w-6 h-6 mr-2 -mt-1 text-[#3bbe5d]" />
                  Conquistas Desbloqueadas
                </h2>
                {unlockedAchievements.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {unlockedAchievements.map((achievement) => (
                      <div 
                        key={achievement.key}
                        className="relative p-4 rounded-xl border border-[#3bbe5d]/50 bg-[#3bbe5d]/10 shadow-[0_0_15px_rgba(59,190,93,0.2)] flex flex-col items-center text-center transition-all duration-300"
                      >
                        <div className="p-3 rounded-full mb-3 bg-black/40">
                          {achievement.icon}
                        </div>
                        <h3 className="font-bold text-sm mb-1 text-white">
                          {achievement.title}
                        </h3>
                        <p className="text-[10px] text-gray-300 uppercase tracking-wide leading-tight">
                          {achievement.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    Nenhuma conquista desbloqueada ainda.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CONTEÚDO: BIBLIOTECA (Todos os jogos) */}
            <TabsContent value="library" className="animate-fade-in">
               <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60 min-h-[50vh]">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <span className="text-primary">🎮</span> Biblioteca de Avaliações
                  </h3>
                  {allGames.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {allGames.map((game) => (
                        <Link key={game.id} to={`/game/${game.id}`} className="block group relative">
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 border border-white/5 bg-gray-900">
                            <img 
                              src={game.cover || "/placeholder.png"} 
                              alt={game.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* NOTA DO JOGO NO CANTINHO */}
                            <div className="absolute top-2 right-2 bg-black/80 border border-primary text-primary font-black text-xs px-2 py-1 rounded-md shadow-lg z-10">
                               {typeof game.nota_geral === 'number' ? game.nota_geral.toFixed(1) : "?"}
                            </div>

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-primary font-bold text-sm border border-primary px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">Ver Detalhes</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium truncate text-gray-300 group-hover:text-primary transition-colors">
                            {game.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                       <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                       <p>Este usuário ainda não avaliou nenhum jogo.</p>
                    </div>
                  )}
               </div>
            </TabsContent>

            {/* CONTEÚDO: TIERLISTS */}
            <TabsContent value="tierlists" className="animate-fade-in">
               <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60 min-h-[50vh]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-primary">📊</span> Tierlists Criadas
                    </h3>
                    {isOwner && (
                       <Button onClick={() => navigate("/tierlist")} size="sm" className="bg-primary text-black hover:bg-primary/90">
                         Nova Tierlist
                       </Button>
                    )}
                  </div>

                  {allTierlists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {allTierlists.map((tier) => (
                         <div key={tier.id} className="bg-gray-900/50 p-5 rounded-xl border border-white/10 hover:border-primary/50 transition-all group">
                           <div className="flex justify-between items-start mb-4">
                             <h4 className="font-bold text-lg text-white truncate pr-2">{tier.name}</h4>
                             <div className="flex gap-1">
                               {isOwner && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTierlist(tier.id); }}
                                    className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               )}
                             </div>
                           </div>
                           
                           <div className="mt-4">
                              <Button 
                                className="w-full bg-white/5 hover:bg-primary hover:text-black border border-white/10 text-white transition-all"
                                onClick={() => window.location.href = `/tierlist?load=${tier.id}`}
                              >
                                Visualizar
                              </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                       <List className="w-16 h-16 mb-4 opacity-20" />
                       <p>Nenhuma Tierlist criada ainda.</p>
                       {isOwner && <Button variant="link" onClick={() => navigate("/tierlist")} className="text-primary">Criar a primeira</Button>}
                    </div>
                  )}
               </div>
            </TabsContent>

          </Tabs>

        </div>
        
        {isOwner && (
          <EditProfileDialog 
            open={editDialogOpen} 
            onOpenChange={setEditDialogOpen}
            currentBio={profile.bio}
            currentUsername={profile.username}
            currentNickname={profile.nickname}
            currentSocial={profile.social}
            onProfileUpdate={fetchProfile} 
          />
        )}
      </div>
    </div>
  );
}