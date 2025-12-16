import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, Calendar, Newspaper, ArrowLeft, ExternalLink, 
  Gamepad2, Loader2, Award, Clock, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- DADOS ESTÁTICOS: THE GAME AWARDS 2025 ---
const TGA_2025_WINNERS = [
  {
    category: "Game of the Year (Jogo do Ano)",
    winner: "Clair Obscur: Expedition 33",
    developer: "Sandfall Interactive",
    nominees: ["Death Stranding 2", "Hades II", "Hollow Knight: Silksong", "Kingdom Come: Deliverance II", "Donkey Kong Bananza"]
  },
  {
    category: "Melhor Direção",
    winner: "Clair Obscur: Expedition 33",
    developer: "Sandfall Interactive",
    nominees: ["Death Stranding 2", "Ghost of Yōtei", "Hades II", "Split Fiction"]
  },
  {
    category: "Melhor Narrativa",
    winner: "Clair Obscur: Expedition 33",
    developer: "Sandfall Interactive",
    nominees: ["Silent Hill f", "Ghost of Yōtei", "Kingdom Come: Deliverance II"]
  },
  {
    category: "Melhor Jogo de Ação",
    winner: "Hades II",
    developer: "Supergiant Games",
    nominees: ["Battlefield 6", "Doom: The Dark Ages", "Ninja Gaiden 4"]
  },
  {
    category: "Melhor RPG",
    winner: "Clair Obscur: Expedition 33",
    developer: "Sandfall Interactive",
    nominees: ["Avowed", "Monster Hunter Wilds", "The Outer Worlds 2"]
  },
  {
    category: "Jogo Mais Aguardado",
    winner: "Grand Theft Auto VI",
    developer: "Rockstar Games",
    nominees: ["The Witcher 4", "Marvel's Wolverine", "Resident Evil Requiem"]
  },
  {
    category: "Melhor Jogo em Andamento",
    winner: "No Man's Sky",
    developer: "Hello Games",
    nominees: ["Fortnite", "Final Fantasy XIV", "Helldivers 2"]
  },
  {
    category: "Melhor Adaptação",
    winner: "The Last of Us - Season 2",
    developer: "HBO",
    nominees: ["A Minecraft Movie", "Until Dawn (Filme)", "Devil May Cry (Anime)"]
  }
];

export default function Dados() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("releases");

  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    // Buscar lançamentos (Agora virá traduzido do backend)
    setLoadingUpcoming(true);
    fetch("/api/games/upcoming")
      .then(res => res.json())
      .then(data => setUpcomingGames(data))
      .catch(err => console.error("Erro lançamentos:", err))
      .finally(() => setLoadingUpcoming(false));

    // Buscar notícias (Agora virá traduzido do backend)
    setLoadingNews(true);
    fetch("/api/news/latest")
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(err => console.error("Erro notícias:", err))
      .finally(() => setLoadingNews(false));
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatNewsDate = (timestamp: number) => {
      const now = Math.floor(Date.now() / 1000);
      const diff = now - timestamp;
      if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} horas atrás`;
      return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-black font-pixel text-primary uppercase tracking-wide">
              Central de Dados
            </h1>
            <p className="text-gray-400 text-sm">
              Lançamentos, Notícias e Premiações do Mundo Gamer
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
             <TabsList className="bg-white/5 border border-white/10 p-1">
                <TabsTrigger value="releases" className="data-[state=active]:bg-primary data-[state=active]:text-black min-w-[150px]">
                   <Calendar className="w-4 h-4 mr-2" /> Futuros Lançamentos
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-black min-w-[150px]">
                   <Newspaper className="w-4 h-4 mr-2" /> Notícias (Steam)
                </TabsTrigger>
                <TabsTrigger value="goty" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black min-w-[150px]">
                   <Trophy className="w-4 h-4 mr-2" /> TGA 2025
                </TabsTrigger>
             </TabsList>
          </div>

          {/* ABA 1: LANÇAMENTOS */}
          <TabsContent value="releases" className="animate-fade-in">
             {loadingUpcoming ? (
                 <div className="flex flex-col items-center justify-center py-20 text-primary gap-2">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-xs text-gray-400 uppercase">Traduzindo dados...</span>
                 </div>
             ) : upcomingGames.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {upcomingGames.map((game) => (
                        <div key={game.id} className="group bg-[#151515] border border-white/5 rounded-xl overflow-hidden hover:border-primary/50 transition-all flex flex-col h-full">
                           <div className="relative aspect-video overflow-hidden">
                               <img 
                                 src={game.image || "/placeholder.png"} 
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                               />
                               <div className="absolute top-2 right-2 bg-black/80 text-primary text-xs font-bold px-2 py-1 rounded border border-primary/20">
                                   {formatDate(game.release_date)}
                               </div>
                           </div>
                           <div className="p-4 flex flex-col flex-1">
                               <h3 className="font-bold text-lg text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                                   {game.name}
                               </h3>
                               <div className="flex flex-wrap gap-2 mb-3">
                                   {game.genres && game.genres.map((g: string) => (
                                       <Badge key={g} variant="outline" className="text-[10px] border-white/10 text-gray-400">
                                           {g}
                                       </Badge>
                                   ))}
                               </div>
                               <p className="text-gray-500 text-xs line-clamp-3 mb-4 flex-1">
                                   {game.summary}
                               </p>
                               <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto pt-4 border-t border-white/5">
                                   <Gamepad2 className="w-3 h-3" />
                                   {game.platforms?.join(", ") || "Plataformas TBD"}
                               </div>
                           </div>
                        </div>
                    ))}
                 </div>
             ) : (
                 <div className="text-center py-20 text-gray-500">
                     <p>Nenhum lançamento encontrado.</p>
                 </div>
             )}
          </TabsContent>

          {/* ABA 2: NOTÍCIAS */}
          <TabsContent value="news" className="animate-fade-in max-w-4xl mx-auto">
             {loadingNews ? (
                 <div className="flex flex-col items-center justify-center py-20 text-primary gap-2">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-xs text-gray-400 uppercase">Buscando e traduzindo...</span>
                 </div>
             ) : news.length > 0 ? (
                 <div className="space-y-4">
                     {news.map((item) => (
                         <div key={item.id} className="bg-[#151515] border border-white/5 rounded-xl p-5 hover:bg-white/5 transition-colors flex gap-4">
                             <div className="flex-shrink-0 pt-1">
                                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                     <Newspaper className="w-5 h-5" />
                                 </div>
                             </div>
                             <div className="flex-1">
                                 <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-white text-lg hover:text-primary transition-colors cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                        {item.title}
                                    </h3>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {formatNewsDate(item.date)}
                                    </span>
                                 </div>
                                 <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                                     {item.content_snippet}
                                 </p>
                                 <div className="flex justify-between items-center text-xs">
                                     <span className="text-primary font-bold">{item.author}</span>
                                     <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-gray-500 hover:text-white">
                                         Ler na Steam <ExternalLink className="w-3 h-3" />
                                     </a>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="text-center py-20 text-gray-500">
                     <p>Nenhuma notícia encontrada no momento.</p>
                 </div>
             )}
          </TabsContent>

          {/* ABA 3: TGA 2025 (COM FUNDO DO CLAIR OBSCUR CORRIGIDO) */}
          <TabsContent value="goty" className="animate-fade-in">
              <div className="relative rounded-2xl overflow-hidden mb-8 border border-yellow-500/30 min-h-[450px] flex items-center">
                  
                  {/* Fundo do Jogo com Baixa Opacidade */}
                  <div 
                      className="absolute inset-0 bg-cover bg-center z-0"
                      style={{ 
                          backgroundImage: "url('https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1903340/library_hero.jpg')", // ID CORRIGIDO
                          filter: "grayscale(20%)" // Um pouco de desaturação para ficar mais elegante
                      }}
                  />
                  {/* Camada Escura para dar o efeito de "Opacidade Baixa" na imagem (para o texto ler bem) */}
                  <div className="absolute inset-0 bg-black/80 z-0" />
                  
                  {/* Gradiente Lateral para foco */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/40 via-black/60 to-black/90 z-0" />

                  {/* Conteúdo */}
                  <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                      <div className="bg-black/60 p-8 rounded-xl border border-yellow-500/30 backdrop-blur-md max-w-2xl shadow-2xl">
                          <div className="flex items-center gap-2 mb-4 text-yellow-400 font-bold uppercase tracking-[0.2em] text-xs">
                              <Crown className="w-5 h-5 fill-current" /> Vencedor Jogo do Ano
                          </div>
                          <h2 className="text-4xl md:text-6xl font-black text-white font-pixel mb-6 leading-none drop-shadow-lg">
                              CLAIR OBSCUR: <br/>EXPEDITION 33
                          </h2>
                          <p className="text-gray-200 text-lg mb-6 leading-relaxed border-l-4 border-yellow-500 pl-4">
                              O aclamado RPG da Sandfall Interactive levou o prêmio máximo, conquistando também Melhor Narrativa e Melhor Direção de Arte.
                          </p>
                          <div className="flex gap-4">
                              <Badge className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-sm px-4 py-1">GOTY 2025</Badge>
                              <Badge variant="outline" className="text-white border-white/30 bg-black/50">RPG</Badge>
                              <Badge variant="outline" className="text-white border-white/30 bg-black/50">Turn-Based</Badge>
                          </div>
                      </div>
                      
                      {/* Troféu Decorativo */}
                      <div className="hidden md:block opacity-90">
                           <Trophy className="w-48 h-48 text-yellow-500 drop-shadow-[0_0_35px_rgba(234,179,8,0.4)] animate-pulse" />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {TGA_2025_WINNERS.map((item, idx) => (
                      <Card key={idx} className="bg-[#151515] border-white/5 hover:border-yellow-500/30 transition-all hover:bg-white/5">
                          <CardHeader className="pb-2">
                              <CardDescription className="text-yellow-500/80 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                  <Award className="w-3 h-3" /> {item.category}
                              </CardDescription>
                              <CardTitle className={`text-xl ${item.winner.includes("Clair") ? "text-yellow-400 font-bold" : "text-white"}`}>
                                  {item.winner}
                              </CardTitle>
                              <p className="text-sm text-gray-500">{item.developer}</p>
                          </CardHeader>
                          <CardContent>
                              <Separator className="bg-white/5 my-3" />
                              <p className="text-[10px] text-gray-600 mb-2 uppercase font-bold tracking-widest">Indicados</p>
                              <div className="flex flex-wrap gap-2">
                                  {item.nominees.map((nom, i) => (
                                      <span key={i} className="text-xs bg-black/40 px-2 py-1 rounded text-gray-500 border border-white/5">
                                          {nom}
                                      </span>
                                  ))}
                              </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}