import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SearchBar = () => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative glass-panel rounded-lg overflow-hidden group focus-within:border-primary/40 transition-all">
        <input
          type="text"
          placeholder="Pesquisar jogos..."
          className="w-full bg-transparent px-5 py-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none font-medium"
        />
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 group-hover:text-primary transition-colors">
          <Search className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
