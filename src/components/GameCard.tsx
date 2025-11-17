import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  title: string;
  image: string;
}

export const GameCard = ({ title, image }: GameCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/game/${title.toLowerCase().replace(/\s+/g, '-')}`);
  };
  
  return (
    <Card 
      onClick={handleClick}
      className="group relative overflow-hidden rounded-lg glass-panel transition-all duration-300 hover:border-primary/40 cursor-pointer"
    >
      {/* Image Container */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-300" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full glass-panel border border-primary/40 flex items-center justify-center">
            <Play className="h-6 w-6 text-primary fill-primary" />
          </div>
        </div>
        
        {/* Minimal corner accents */}
        <div className="absolute top-2 left-2 w-2 h-2 border-l border-t border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2 w-2 h-2 border-r border-t border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Title Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 via-background/70 to-transparent backdrop-blur-sm">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </Card>
  );
};
