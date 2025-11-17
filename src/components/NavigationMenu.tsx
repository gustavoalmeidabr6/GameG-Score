import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Home, User, BarChart3, List, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NavigationMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: "Tela Principal", href: "/home" },
    { icon: User, label: "Perfil", href: "/profile" },
    { icon: BarChart3, label: "Estatísticas", href: "/statistics" },
    { icon: List, label: "Tierlist", href: "/tierlist" },
    { icon: LogOut, label: "Sair", href: "/" },
  ];

  const handleNavigate = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg glass-panel hover:border-primary/40 transition-all"
        >
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 glass-panel border-primary/30 mt-2"
      >
        <div className="py-1">
          {menuItems.map((item) => (
            <DropdownMenuItem 
              key={item.label}
              onClick={() => handleNavigate(item.href)}
              className="group px-4 py-2.5 cursor-pointer transition-all hover:bg-primary/5 focus:bg-primary/5"
            >
              <div className="flex items-center gap-3 w-full">
                <item.icon className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
