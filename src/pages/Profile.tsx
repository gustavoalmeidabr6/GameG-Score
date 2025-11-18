import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, TrendingUp, Star, Award, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/RadarChart";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import { ProfileHeader } from "@/components/ProfileHeader"; // Importar o Header correto

const PLATFORMS = [
  { name: "Xbox", key: "xbox", icon: "🎮" },
  { name: "Steam", key: "steam", icon: "💻" },
  { name: "Epic Games", key: "epic", icon: "🔷" },
  { name: "PSN", key: "psn", icon: "🔵" },
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
      if (response.status === 404) {
        toast.error("Sessão expirada.");
        localStorage.clear();
        navigate("/login");
        return;
      }
      const data = await response.json();
      if (response.ok) setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  if (loading || !profile) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;

  const userAverage = profile.top_favorites?.length > 0
    ? (profile.top_favorites.reduce((acc: any, curr: any) => acc + curr.nota_geral, 0) / profile.top_favorites.length).toFixed(1)
    : "0.0";

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
          
          {/* Usa o componente ProfileHeader, mas precisamos passar os dados reais */}
          <ProfileHeader 
             username={profile.username}
             level={profile.level}
             rank={`XP: ${profile.xp}`} // Adaptando para mostrar XP no lugar do rank por enquanto
             avatarUrl={profile.avatar_url}
          />
          
           <div className="flex justify-end -mt-6 mb-6">
              <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="border-primary text-primary">
                  <Edit className="mr-2 h-4 w-4" /> Editar Perfil
              </Button>
           </div>

          {/* TOP 3 FAVORITOS */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8 text-center font-pixel">Top 3 Melhores Avaliações</h2>
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
              <div className="text-center py-10 text-gray-400">Você ainda não avaliou nenhum jogo.</div>
            )}
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid md:grid-cols-3 gap-6">
             <div className="md:col-span-1 glass-panel rounded-xl border border-primary/20 p-6 bg-black/60">
              <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">Plataformas</h2>
              <div className="space-y-3">
                {PLATFORMS.map((platform) => (
                  <div key={platform.key} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3"><span className="text-xl">{platform.icon}</span><span className="text-sm font-medium text-gray-200">{platform.name}</span></div>
                    {profile.stats.accounts[platform.key] ? <Check className="h-4 w-4 text-primary" /> : <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-400">Conectar</Button>}
                  </div>
                ))}
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