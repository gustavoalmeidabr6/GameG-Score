import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";

export default function Community() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Erro ao buscar usuários.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Função para ver o perfil de outro usuário (ainda vamos criar essa rota específica, 
  // por enquanto vou redirecionar para uma rota genérica /profile/:id)
  const handleViewProfile = (userId: number) => {
    // Por enquanto, se você clicar, ele vai para a sua tela de perfil, mas carregando os dados DAQUELE usuário.
    // Para isso funcionar perfeito, precisaremos ajustar o Profile.tsx para aceitar ID na URL (ex: /profile/5).
    // Vou deixar preparado aqui:
    navigate(`/profile/${userId}`); 
  };

  return (
    <div className="min-h-screen relative text-foreground p-6 font-sans">
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
      
      <div className="relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary uppercase tracking-tight font-pixel mb-2">
              Comunidade
            </h1>
            <p className="text-muted-foreground">Encontre outros jogadores e veja seus perfis</p>
          </div>

          {/* Barra de Busca */}
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou nick..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-black/40 border-primary/30 focus:border-primary text-white placeholder:text-gray-400 rounded-xl"
            />
            <Button 
              type="submit" 
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-primary text-black font-bold hover:bg-primary/90"
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {/* Resultados */}
          <div className="space-y-4">
            {users.map((user) => (
              <div 
                key={user.id}
                onClick={() => handleViewProfile(user.id)}
                className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer group bg-black/40"
              >
                <div className="relative">
                   <img 
                     src={user.avatar_url} 
                     alt={user.nickname} 
                     className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                   />
                   <div className="absolute -bottom-1 -right-1 bg-black text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary">
                     LVL {user.level}
                   </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                    {user.nickname}
                  </h3>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>

                <Button variant="ghost" className="text-primary hover:bg-primary/10">
                  Ver Perfil <User className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ))}

            {!loading && users.length === 0 && query && (
              <div className="text-center py-10 text-gray-500">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}