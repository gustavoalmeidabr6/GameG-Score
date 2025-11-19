import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart } from "@/components/RadarChart";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";

export default function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(`/api/statistics/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          toast.error("Erro ao carregar estatísticas.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando Estatísticas...</div>;

  if (!stats || (Object.keys(stats.top_by_genre).length === 0 && Object.keys(stats.best_by_attribute).length === 0)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p>Você ainda não avaliou jogos suficientes para gerar estatísticas.</p>
        <Button variant="outline" onClick={() => navigate("/home")}>Avaliar Jogos</Button>
      </div>
    );
  }

  // Labels amigáveis para os atributos
  const attributeLabels: Record<string, string> = {
    jogabilidade: "Jogabilidade",
    graficos: "Gráficos",
    narrativa: "Narrativa",
    audio: "Áudio",
    desempenho: "Desempenho",
  };

  return (
    <div className="min-h-screen relative text-foreground p-6 font-sans">
      {/* Full-screen Background Image with Overlay */}
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
      
      {/* Content */}
      <div className="relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-7xl mx-auto space-y-12">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tight font-pixel mb-2">
              Estatísticas Detalhadas
            </h1>
            <p className="text-muted-foreground">Análise completa das suas avaliações</p>
          </div>

          {/* --- ORDEM ALTERADA: AGORA "POR ATRIBUTO" VEM PRIMEIRO --- */}
          
          {/* Section 1: Best by Attribute */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 shadow-[0_0_30px_hsl(var(--primary)/0.2)] bg-black/60">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel mb-8 text-center">
              Melhores por Atributo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(stats.best_by_attribute).map(([attribute, games]: [string, any]) => {
                if (games.length === 0) return null;
                
                return (
                  <div 
                    key={attribute}
                    className="glass-panel rounded-xl border border-primary/20 p-6"
                  >
                    <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 text-center">
                      {attributeLabels[attribute] || attribute}
                    </h3>
                    <div className="space-y-3">
                      {games.map((game: any, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 glass-panel rounded-lg border border-primary/10 bg-white/5"
                        >
                          <span className="text-sm text-foreground font-medium truncate mr-2">{game.title}</span>
                          <span className="text-lg font-black text-primary">{game.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Best by Genre (Agora embaixo) */}
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 shadow-[0_0_30px_hsl(var(--primary)/0.2)] bg-black/60">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel mb-8 text-center">
              Melhores por Gênero
            </h2>
            
            {Object.entries(stats.top_by_genre).map(([genre, games]: [string, any]) => (
              <div key={genre} className="mb-12 last:mb-0">
                <h3 className="text-xl font-black text-white/90 uppercase tracking-wider mb-6 border-b border-primary/30 pb-2 inline-block">
                  {genre}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {games.map((game: any, index: number) => (
                    <div 
                      key={index}
                      className="glass-panel rounded-xl border border-primary/20 p-6 hover:border-primary/40 transition-all relative overflow-hidden group"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(${game.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="relative z-10 flex flex-col items-center">
                        <h4 className="font-bold text-white mb-4 text-center truncate w-full">{game.title}</h4>
                        <RadarChart
                          data={game.ratings}
                          size={150}
                          showLabels={false}
                        />
                        <div className="mt-2 font-black text-primary text-lg">{game.nota_geral.toFixed(1)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}