import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, TrendingUp, Star, Award, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/RadarChart";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import welcomeBg from "@/assets/welcome-bg.jpg";
import heroBanner from "@/assets/hero-banner-green.jpg";

const linkedAccounts = [
  { name: "Xbox", icon: "🎮", connected: true },
  { name: "Steam", icon: "🎮", connected: true },
  { name: "Epic Games", icon: "🎮", connected: false },
  { name: "PSN", icon: "🎮", connected: false },
];

const stats = [
  { label: "Jogos Avaliados", value: "42", icon: TrendingUp },
  { label: "Média de Notas", value: "8.7", icon: Star },
  { label: "Gênero Favorito", value: "RPG", icon: Award },
];

const achievements = [
  { name: "Primeira Review", unlocked: true, icon: "🏆" },
  { name: "Crítico de RPG", unlocked: true, icon: "⚔️" },
  { name: "Maratonista", unlocked: true, icon: "🎯" },
  { name: "Colecionador", unlocked: false, icon: "📚" },
  { name: "Explorador", unlocked: false, icon: "🗺️" },
  { name: "Speedrunner", unlocked: false, icon: "⚡" },
];

const topFavorites = [
  { 
    title: "The Witcher 3", 
    ratings: { jogabilidade: 9, graficos: 10, narrativa: 10, audio: 9, desempenho: 8 },
    cover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop"
  },
  { 
    title: "Elden Ring", 
    ratings: { jogabilidade: 10, graficos: 9, narrativa: 9, audio: 9, desempenho: 7 },
    cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop"
  },
  { 
    title: "Cyberpunk 2077", 
    ratings: { jogabilidade: 8, graficos: 10, narrativa: 9, audio: 9, desempenho: 7 },
    cover: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop"
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const [xpProgress] = useState(65);
  const [level] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <div className="min-h-screen relative text-foreground p-6">
      {/* Full-screen Background Image with Overlay */}
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
      
      {/* Content */}
      <div className="relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Profile Header with Banner Background */}
          <div className="relative glass-panel rounded-2xl border-2 border-primary/30 overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
            {/* Banner Background */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${heroBanner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-background/85" />
            </div>
            
            <div className="relative p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop"
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-primary/50 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass-panel px-3 py-1 rounded-full border border-primary/30">
                    <span className="text-xs font-black text-primary">LVL {level}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  Editar Perfil
                </Button>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 
                    className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2"
                    style={{ fontFamily: "'Press Start 2P', cursive" }}
                  >
                    NOME
                  </h1>
                  <p className="text-sm text-muted-foreground">Membro desde 2024</p>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary/70 uppercase tracking-wider">Progresso de XP</span>
                    <span className="text-primary font-bold">{xpProgress}%</span>
                  </div>
                  <Progress value={xpProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    {100 - xpProgress}% para o próximo nível
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Top 3 Favoritos Section */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8 text-center font-pixel">
              Top 3 Favoritos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topFavorites.map((game, index) => (
                <div 
                  key={index}
                  className="glass-panel rounded-xl border border-primary/20 p-6 hover:border-primary/40 transition-all relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${game.cover})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <RadarChart
                    data={game.ratings}
                    size={200}
                    showLabels={true}
                    title={game.title}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Linked Accounts */}
            <div className="md:col-span-1 space-y-6">
              <div className="glass-panel rounded-xl border border-primary/20 p-6">
                <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4">
                  Contas Vinculadas
                </h2>
                <div className="space-y-3">
                  {linkedAccounts.map((account) => (
                    <div
                      key={account.name}
                      className="flex items-center justify-between p-3 glass-panel rounded-lg border border-primary/10 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{account.icon}</span>
                        <span className="text-sm font-medium text-foreground">
                          {account.name}
                        </span>
                      </div>
                      {account.connected ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Achievements */}
            <div className="md:col-span-2 space-y-6">
              {/* Stats */}
              <div className="glass-panel rounded-xl border border-primary/20 p-6">
                <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4">
                  Estatísticas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="glass-panel rounded-lg border border-primary/10 p-4 hover:border-primary/30 transition-all"
                    >
                      <stat.icon className="h-5 w-5 text-primary/60 mb-2" />
                      <p className="text-2xl font-black text-primary mb-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="glass-panel rounded-xl border border-primary/20 p-6">
                <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4">
                  Conquistas
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.name}
                      className={`glass-panel rounded-lg border p-4 text-center transition-all ${
                        achievement.unlocked
                          ? "border-primary/30 hover:border-primary/50"
                          : "border-primary/10 grayscale opacity-50"
                      }`}
                    >
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <p className={`text-xs font-medium uppercase tracking-wider ${
                        achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {achievement.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <EditProfileDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
        />
      </div>
    </div>
  );
}
