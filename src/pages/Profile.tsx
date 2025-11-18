import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, TrendingUp, Star, Award, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/RadarChart";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";

const PLATFORMS = [
  { name: "Xbox", key: "xbox", icon: "/images/xbox-logo.png" },
  { name: "Steam", key: "steam", icon: "/images/steam-logo.png" },
  { name: "Epic Games", key: "epic", icon: "/images/epic-logo.png" },
  { name: "PSN", key: "psn", icon: "/images/psn-logo.png" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchProfile = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`/api/profile/${userId}`);
      
      // --- CORREÇÃO: Se o usuário não existe mais no banco ---
      if (response.status === 404) {
        toast.error("Sessão expirada. Faça login novamente.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      } else {
        toast.error("Erro ao carregar perfil.");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  if (loading || !profile) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center font-pixel">CARREGANDO PERFIL...</div>;
  }

  const userAverage = profile.top_favorites?.length > 0
    ? (profile.top_favorites.reduce((acc: any, curr: any) => acc + curr.nota_geral, 0) / profile.top_favorites.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen relative text-white p-6 font-sans">
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${welcomeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
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

        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="relative glass-panel rounded-2xl border-2 border-primary/30 overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${profile.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/70" />
            </div>
            
            <div className="relative p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-full border-4 border-primary/50 ring-2 ring-primary/20 object-cover"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black px-3 py-1 rounded-full border border-primary/50">
                      <span className="text-xs font-black text-primary font-pixel">LVL {profile.level}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                </div>

                <div className="flex-1 space-y-4 text-center md:text-left w-full">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wide mb-2 font-pixel">
                      {profile.username}
                    </h1>
                    <p className="text-sm text-gray-300 italic">"{profile.bio}"</p>
                  </div>

                  <div className="space-y-2 max-w-md mx-auto md:mx-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary/70 uppercase tracking-wider font-pixel text-xs">XP Total</span>
                      <span className="text-primary font-bold font-pixel">{profile.xp} XP</span>
                    </div>
                    <Progress value={(profile.xp % 500) / 500 * 100} className="h-3 bg-gray-800" />
                    <p className="text-xs text-gray-500 text-right">
                      {500 - (profile.xp % 500)} XP para o próximo nível
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOP 3 FAVORITOS */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8 text-center font-pixel">
              Top 3 Melhores Avaliações
            </h2>
            
            {profile.top_favorites && profile.top_favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {profile.top_favorites.map((game: any, index: number) => (
                  <div 
                    key={index}
                    className="rounded-xl border border-primary/20 p-6 hover:border-primary/60 transition-all relative overflow-hidden group h-[400px] flex flex-col justify-between"
                  >
                    <div 
                      className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                      style={{
                        backgroundImage: `url(${game.game_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                    
                    <div className="relative z-10 flex flex-col items-center h-full">
                      <h3 className="text-lg font-bold text-white text-center mb-4 font-pixel truncate w-full px-2">
                        {game.game_name}
                      </h3>
                      
                      <div className="flex-grow flex items-center justify-center w-full">
                         <RadarChart
                          data={{
                            jogabilidade: game.jogabilidade,
                            graficos: game.graficos,
                            narrativa: game.narrativa,
                            audio: game.audio,
                            desempenho: game.desempenho
                          }}
                          size={180}
                          showLabels={true}
                        />
                      </div>
                      
                      <div className="mt-4 bg-primary/20 px-4 py-2 rounded-full border border-primary/50">
                         <span className="text-xl font-black text-primary font-pixel">{game.nota_geral.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 mb-4">Você ainda não avaliou nenhum jogo.</p>
                <Button onClick={() => navigate("/home")} variant="outline" className="border-primary text-primary">
                  Começar a Avaliar
                </Button>
              </div>
            )}
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 glass-panel rounded-xl border border-primary/20 p-6 bg-black/60">
              <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                Plataformas
              </h2>
              <div className="space-y-3">
                {PLATFORMS.map((platform) => (
                  <div
                    key={platform.key}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={platform.icon} 
                        alt={platform.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                      />
                      <span className="hidden text-xl">🎮</span>
                      <span className="text-sm font-medium text-gray-200">
                        {platform.name}
                      </span>
                    </div>
                    {profile.stats.accounts[platform.key] ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-400 hover:text-white">
                        Conectar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 glass-panel rounded-xl border border-primary/20 p-6 bg-black/60">
              <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">
                Estatísticas da Carreira
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary mb-2" />
                  <p className="text-3xl font-black text-white font-pixel">{profile.stats.reviews_count}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Jogos Avaliados</p>
                </div>

                <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                  <Star className="h-6 w-6 text-primary mb-2" />
                  <p className="text-3xl font-black text-white font-pixel">{userAverage}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Média de Notas</p>
                </div>

                <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                  <Award className="h-6 w-6 text-primary mb-2" />
                  <p className="text-xl font-bold text-white font-pixel mt-1">RPG</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Gênero Favorito</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EditProfileDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          currentBio={profile.bio}
          onProfileUpdate={fetchProfile} 
        />
      </div>
    </div>
  );
}