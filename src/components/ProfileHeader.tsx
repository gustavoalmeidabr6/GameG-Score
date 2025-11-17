import { Badge } from "@/components/ui/badge";
import heroBanner from "@/assets/hero-banner-green.jpg";
import { Crown, Zap } from "lucide-react";

interface ProfileHeaderProps {
  username: string;
  level: number;
  rank: string;
  avatarUrl: string;
}

export const ProfileHeader = ({ username, level, rank, avatarUrl }: ProfileHeaderProps) => {
  const xpProgress = 65; // Percentage
  
  return (
    <div className="relative w-full mb-12">
      {/* Wingman Layout Container */}
      <div className="glass-panel border-2 border-primary/40 rounded-2xl shadow-[0_0_30px_hsl(var(--primary)/0.2)] overflow-hidden">
        {/* Background with subtle pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Main Container with proper height */}
        <div className="relative flex items-center justify-center gap-8 px-8 py-6 md:py-8">
          {/* Left Wing: Username & Level */}
          <div className="flex flex-col items-end gap-2 min-w-[180px]">
            <span className="text-xl md:text-2xl font-black text-primary uppercase tracking-wider font-pixel">
              {username}
            </span>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs font-pixel px-3 py-1">
              LVL {level}
            </Badge>
            
            {/* Tech Line Decoration */}
            <div className="flex items-center gap-1 mt-1">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-1 h-1 bg-primary/50 rounded-full" />
            </div>
          </div>

          {/* Center: Avatar (Nuclear) */}
          <div className="relative flex-shrink-0">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
            
            {/* Avatar */}
            <img
              src={avatarUrl}
              alt={username}
              className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-primary/50 ring-4 ring-primary/20 ring-offset-4 ring-offset-background shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
            />
            
            {/* Tech Corner Brackets */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-primary/60" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-primary/60" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-primary/60" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-primary/60" />
          </div>

          {/* Right Wing: Rank & XP */}
          <div className="flex flex-col items-start gap-2 min-w-[180px]">
            {/* Rank Badge */}
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg border border-primary/30">
              <Crown className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[9px] text-primary/70 uppercase tracking-widest font-medium">Rank</span>
                <span className="text-sm font-black text-primary uppercase tracking-wider">
                  {rank}
                </span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  XP: {xpProgress}% para próximo rank
                </span>
              </div>
              <div className="relative w-full h-2 glass-panel rounded-full overflow-hidden border border-primary/30">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                  style={{ width: `${xpProgress}%` }}
                />
                {/* Segmentation lines */}
                <div className="absolute inset-0 flex justify-between px-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-px h-full bg-background/50" />
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Line Decoration */}
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
