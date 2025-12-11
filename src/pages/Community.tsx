import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, Trophy, Medal, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import defaultAvatar from "@/assets/defaultprofile.png";

export default function Community() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]); // Resultados da busca (ou lista alfabética)
  const [topUsers, setTopUsers] = useState<any[]>([]); // Top 10
  const [loading, setLoading] = useState(false);

  // Carrega os dados iniciais (Top 10 + Lista Alfabética)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const topRes = await fetch('/api/users/top');
        if (topRes.ok) setTopUsers(await topRes.json());

        // Carrega a lista inicial (alfabética) sem filtro
        setLoading(true);
        const searchRes = await fetch('/api/users/search');
        if (searchRes.ok) setUsers(await searchRes.json());
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Efeito para "Live Search" (Debounce de 500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Se tiver query, busca filtrado. Se não, busca tudo (alfabético).
      setLoading(true);
      const url = query.trim() 
        ? `/api/users/search?q=${encodeURIComponent(query)}` 
        : `/api/users/search`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setUsers(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }, 500); // Aguarda 500ms após parar de digitar para buscar

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleViewProfile = (userId: number) => {
    navigate(`/profile/${userId}`); 
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-gray-500 font-pixel">#{index + 1}</span>;
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
            <p className="text-muted-foreground">Encontre outros jogadores e veja o ranking global</p>
          </div>

          {/* Barra de Busca (Sem botão, pois é automática) */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Digite para buscar um jogador..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-black/40 border-primary/30 focus:border-primary text-white placeholder:text-gray-400 rounded-xl transition-all"
            />
          </div>

          <div className="space-y-8">
            
            {/* Se NÃO estiver buscando, mostra o TOP 10 (Ranking) */}
            {!query.trim() && topUsers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <Trophy className="w-5 h-5 text-yellow-400" /> Ranking Global
                </h2>
                {topUsers.map((user, index) => (
                  <div 
                    key={user.id}
                    onClick={() => handleViewProfile(user.id)}
                    className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-yellow-500/50 transition-all cursor-pointer group bg-black/40"
                  >
                    <div className="w-10 flex justify-center">{getRankIcon(index)}</div>
                    <div className="relative">
                       <img 
                         src={user.avatar_url || defaultAvatar} 
                         alt={user.nickname} 
                         className={`w-14 h-14 rounded-full border-2 object-cover bg-black ${index === 0 ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-primary'}`}
                       />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold transition-colors ${index === 0 ? 'text-yellow-400' : 'text-white group-hover:text-primary'}`}>
                        {user.nickname || user.username}
                      </h3>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                    <div className="text-right mr-4">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider">XP Total</span>
                      <span className="text-lg font-black text-white font-pixel">{user.xp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de Usuários (Alfabética ou Busca) */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {query.trim() ? (
                  <>
                    <Search className="w-5 h-5 text-primary" /> Resultados da Busca
                    {loading && <span className="text-sm font-normal text-gray-500 ml-2 animate-pulse">(Buscando...)</span>}
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 text-blue-400" /> Todos os Membros (A-Z)
                  </>
                )}
              </h2>

              {loading && users.length === 0 ? (
                <div className="text-center py-10 text-gray-500 animate-pulse">Carregando lista...</div>
              ) : (
                <>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <div 
                        key={user.id}
                        onClick={() => handleViewProfile(user.id)}
                        className="flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer group bg-black/40"
                      >
                        <div className="relative">
                           <img 
                             src={user.avatar_url || defaultAvatar} 
                             alt={user.nickname} 
                             className="w-12 h-12 rounded-full border border-white/20 object-cover bg-black group-hover:border-primary"
                           />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                            {user.nickname || user.username}
                          </h3>
                          <p className="text-xs text-gray-400">@{user.username} • Lvl {user.level}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                          Ver Perfil
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      {query.trim() ? "Nenhum usuário encontrado." : "Nenhum membro na comunidade ainda."}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}