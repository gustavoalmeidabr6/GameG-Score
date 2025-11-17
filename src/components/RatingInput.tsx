import { Slider } from "@/components/ui/slider";
import { LucideIcon } from "lucide-react";

interface RatingInputProps {
  icon: LucideIcon;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const RatingInput = ({ icon: Icon, label, value, onChange }: RatingInputProps) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Icon Circle */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-primary bg-card/40 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold text-primary">
          {value}
        </span>
      </div>
      
      {/* Label */}
      <span className="text-xs text-primary uppercase tracking-widest font-pixel mt-4">
        {label}
      </span>
      
      {/* Slider */}
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        max={10}
        step={1}
        className="w-full"
      />
    </div>
  );
};
