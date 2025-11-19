import { Badge } from "@/components/ui/badge";
import { Crown, Zap } from "lucide-react";
import defaultBanner from "@/assets/BANNER1.PNG";
import defaultAvatar from "@/assets/defaultprofile.png";

interface ProfileHeaderProps {
  username: string;
  level: number;
  rank: string; // Vamos ignorar o que vem do banco e calcular aqui
  avatarUrl: string;
  bannerUrl?: string;
  xp: number;
}

export const ProfileHeader = ({ username, level, avatarUrl, bannerUrl, xp }: ProfileHeaderProps) => {
  
  // --- LÓGICA DE RANKS ---
  const getRankInfo = (currentXp: number) => {
    if (currentXp < 500) return { name: "FERRO", color: "text-gray-400", next: 500, prev: 0 };
    if (currentXp < 1000) return { name: "BRONZE", color: "text-amber-700", next: 1000, prev: 500 };
    if (currentXp < 2000) return { name: "PRATA", color: "text-gray-200", next: 2000, prev: 1000 };
    if (currentXp < 3000) return { name: "OURO", color: "text-yellow-400", next: 3000, prev: 2000 };
    if (currentXp < 4000) return { name: "PLATINA", color: "text-cyan-300", next: 4000, prev: 3000 };
    if (currentXp < 5000) return { name: "ESMERALDA", color: "text-emerald-400", next: 5000, prev: 4000 };
    if (currentXp < 7500) return { name: "DIAMANTE", color: "text-blue-400", next: 7500, prev: 5000 };
    return { name: "SAFIRA", color: "text-indigo-500", next: 100000, prev: 7500 };
  };

  const currentRank = getRankInfo(xp);

  // Calcula porcentagem para o próximo rank
  const xpGainedInTier = xp - currentRank.prev;
  const xpNeededForNext = currentRank.next - currentRank.prev;
  // Se for Safira (ultimo rank), deixa a barra cheia ou calcula pro infinito
  const percentage = currentRank.name === "SAFIRA" ? 100 : Math.min((xpGainedInTier / xpNeededForNext) * 100, 100);
  // -----------------------
  
  return (
    <div className="relative w-full mb-4">
      {/* Wingman Layout Container */}
      <div className="glass-panel border-2 border-primary/40 rounded-2xl shadow-[0_0_30px_hsl(var(--primary)/0.2)] overflow-hidden">
        
        {/* Background with subtle pattern */}
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `url(${bannerUrl || defaultBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Main Container */}
        <div className="relative flex items-center justify-center gap-8 px-8 py-12 md:py-20">
          {/* Left Wing: Username & Level */}
          <div className="flex flex-col items-end gap-2 min-w-[180px]">
            <span className="text-xl md:text-2xl font-black text-white drop-shadow-lg uppercase tracking-wider font-pixel text-right">
              {username}
            </span>
            <Badge variant="outline" className="border-primary bg-black/60 text-primary text-xs font-pixel px-3 py-1 backdrop-blur-md shadow-lg">
              LVL {level}
            </Badge>
            
            <div className="flex items-center gap-1 mt-1">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-1 h-1 bg-primary/50 rounded-full" />
            </div>
          </div>

          {/* Center: Avatar (Nuclear) */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
            
            <img
              src={avatarUrl || defaultAvatar}
              alt={username}
              className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-primary/50 ring-4 ring-primary/20 ring-offset-4 ring-offset-transparent shadow-[0_0_40px_hsl(var(--primary)/0.6)] object-cover bg-black"
            />
            
            {/* Tech Corner Brackets */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-primary/60" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-primary/60" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-primary/60" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-primary/60" />
          </div>

          {/* Right Wing: Rank & XP */}
          <div className="flex flex-col items-start gap-2 min-w-[180px]">
            {/* Rank Badge (AGORA COM O RANK NOVO) */}
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg border border-primary/30 bg-black/60 backdrop-blur-md shadow-lg">
              <Crown className={`h-5 w-5 ${currentRank.color}`} />
              <div className="flex flex-col">
                <span className="text-[9px] text-white/70 uppercase tracking-widest font-medium">Rank Atual</span>
                <span className={`text-sm font-black uppercase tracking-wider ${currentRank.color} drop-shadow-sm`}>
                  {currentRank.name}
                </span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-white drop-shadow-md font-bold uppercase tracking-wider">
                  {currentRank.name === "SAFIRA" 
                    ? "Nível Máximo" 
                    : `Próx: ${Math.floor(xpNeededForNext - xpGainedInTier)} XP`
                  }
                </span>
              </div>
              {/* Barra de Progresso */}
              <div className="relative w-full h-2 glass-panel rounded-full overflow-hidden border border-primary/30 bg-black/50">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 mt-1">
              <div className="w-1 h-1 bg-primary/50 rounded-full" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};