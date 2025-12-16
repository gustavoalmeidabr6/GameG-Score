import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Quote, Users } from "lucide-react"; 
import defaultBanner from "@/assets/BANNER1.png";
import defaultAvatar from "@/assets/defaultprofile.png";

interface ProfileHeaderProps {
  username: string;
  level: number;
  rank: string;
  avatarUrl: string;
  bannerUrl?: string;
  xp: number;
  followersCount?: number; 
  bio?: string;
}

export const ProfileHeader = ({ username, level, avatarUrl, bannerUrl, xp, bio, followersCount }: ProfileHeaderProps) => {
  
  // --- LÓGICA DE RANKS (Mantida igual) ---
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
  const xpGainedInTier = xp - currentRank.prev;
  const xpNeededForNext = currentRank.next - currentRank.prev;
  const percentage = currentRank.name === "SAFIRA" ? 100 : Math.min((xpGainedInTier / xpNeededForNext) * 100, 100);
  // -----------------------
  
  return (
    <div className="relative w-full mb-4">
      {/* Container Principal */}
      <div className="glass-panel border-2 border-primary/40 rounded-2xl shadow-[0_0_30px_hsl(var(--primary)/0.2)] overflow-hidden min-h-[300px] flex flex-col justify-end">
        
        {/* Imagem de Fundo (Banner) */}
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `url(${bannerUrl || defaultBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Gradiente para escurecer o fundo e deixar o texto legível */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Conteúdo Central */}
        {/* ALTERAÇÃO AQUI: Usando Grid para garantir centralização exata do avatar */}
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 px-8 py-8 md:py-10 z-10 w-full">
          
          {/* Esquerda: Username & Level */}
          <div className="flex flex-col items-center md:items-end gap-2 w-full">
            <span className="text-xl md:text-2xl font-black text-white drop-shadow-lg uppercase tracking-wider font-pixel text-center md:text-right break-words max-w-full leading-tight">
              {username}
            </span>
            <Badge variant="outline" className="border-primary bg-black/60 text-primary text-xs font-pixel px-3 py-1 backdrop-blur-md shadow-lg">
              LVL {level}
            </Badge>
          </div>

          {/* Centro: Avatar */}
          <div className="relative flex-shrink-0 flex justify-center">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
                <img
                src={avatarUrl || defaultAvatar}
                alt={username}
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-primary/50 ring-4 ring-primary/20 ring-offset-4 ring-offset-transparent shadow-[0_0_40px_hsl(var(--primary)/0.6)] object-cover bg-black"
                />
            </div>
          </div>

          {/* Direita: Rank & XP */}
          <div className="flex flex-col items-center md:items-start gap-2 w-full">
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg border border-primary/30 bg-black/60 backdrop-blur-md shadow-lg">
              <Crown className={`h-5 w-5 ${currentRank.color}`} />
              <div className="flex flex-col">
                <span className="text-[9px] text-white/70 uppercase tracking-widest font-medium">Rank Atual</span>
                <span className={`text-sm font-black uppercase tracking-wider ${currentRank.color} drop-shadow-sm`}>
                  {currentRank.name}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 w-full max-w-[150px]">
              <div className="flex items-center justify-between gap-2">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-white drop-shadow-md font-bold uppercase tracking-wider">
                  {currentRank.name === "SAFIRA" ? "MAX" : `${Math.floor(percentage)}%`}
                </span>
              </div>
              <div className="relative w-full h-2 glass-panel rounded-full overflow-hidden border border-primary/30 bg-black/50">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* CONTADOR DE SEGUIDORES */}
            <div className="flex justify-center md:justify-start w-full md:w-auto mt-2">
                <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                        {followersCount || 0} Seguidores
                    </span>
                </div>
            </div>

          </div>
        </div>

        {/* BIO: Agora dentro do Banner (Parte inferior) */}
        {bio && (
            <div className="relative z-10 w-full px-6 pb-6 pt-2 text-center">
                 <div className="inline-block bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-6 py-3 max-w-2xl shadow-lg">
                    <p className="text-gray-200 text-sm italic font-medium flex items-center justify-center gap-2 break-words">
                        <Quote className="w-3 h-3 text-primary rotate-180 mb-2 flex-shrink-0" />
                        <span>{bio}</span>
                        <Quote className="w-3 h-3 text-primary mt-2 flex-shrink-0" />
                    </p>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};