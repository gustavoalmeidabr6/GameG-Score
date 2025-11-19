import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

// --- TIPOS ---
type GameDetails = {
  id: number; 
  name: string;
  deck: string; 
  image: { medium_url: string; };
  // Agora pegamos os gêneros
  genres?: { name: string }[]; 
};

type ReviewForm = {
  jogabilidade: number;
  graficos: number;
  narrativa: number;
  audio: number;
  desempenho: number;
};

const defaultReviewState = {
  jogabilidade: 5,
  graficos: 5,
  narrativa: 5,
  audio: 5,
  desempenho: 5,
};

function CircularProgress({ value, max, size = 80, strokeWidth = 8, color = '#3bbe5d', label, icon, showValue = true }: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  icon?: React.ReactNode;
  showValue?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 transition-all duration-300" width={size} height={size}>
          <circle stroke="#333" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
          <circle stroke={color} fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2}
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.3s ease-out' }}
            strokeLinecap="round"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
            {icon && <div className="mb-1 text-gray-400">{icon}</div>}
            <span className="text-sm font-bold font-pixel text-[#3bbe5d]">{value}</span>
          </div>
        )}
      </div>
      {label && <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-pixel">{label}</span>}
    </div>
  );
}

const GameDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameDetails | null>(null);
  const [review, setReview] = useState<ReviewForm>(defaultReviewState);
  const [averageScore, setAverageScore] = useState<number | null>(5.0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const icons = {
    jogabilidade: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c5 1.5 2 5 9 9Z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M11.5 3a17 17 0 0 0 0 18"/><path d="M12.5 3a17 17 0 0 1 0 18"/></svg>,
    graficos: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/></svg>,
    narrativa: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
    audio: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    desempenho: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/></svg>
  };

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      const userId = localStorage.getItem("userId") || "1"; 

      try {
        const gameRes = await fetch(`/api/game/${id}`);
        const gameData = await gameRes.json();
        
        if (gameData && gameData.name) {
          setGame(gameData);
        } else {
          toast.error("Jogo não encontrado.");
          navigate("/home");
          return;
        }

        const reviewRes = await fetch(`/api/review?game_id=${id}&owner_id=${userId}`);
        const reviewData = await reviewRes.json();

        if (!reviewData.error) {
          setReview({
            jogabilidade: reviewData.jogabilidade,
            graficos: reviewData.graficos,
            narrativa: reviewData.narrativa,
            audio: reviewData.audio,
            desempenho: reviewData.desempenho,
          });
          setAverageScore(reviewData.nota_geral);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar informações.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleReviewChange = (key: keyof ReviewForm, value: number) => {
    const updatedReview = { ...review, [key]: value };
    setReview(updatedReview);
    const scores = Object.values(updatedReview);
    const newAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
    setAverageScore(newAverage);
  };

  const handleSubmitReview = async () => {
    if (!game) return;
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("Você precisa estar logado para avaliar!");
      navigate("/");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    // Pega o primeiro gênero da lista, se houver
    const genreName = game.genres && game.genres.length > 0 ? game.genres[0].name : "Desconhecido";

    const reviewData = { 
      ...review, 
      game_id: game.id, 
      game_name: game.name,
      game_image_url: game.image?.medium_url || "",
      genre: genreName, // Enviando o gênero para o backend
      owner_id: parseInt(userId)
    };
    
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      
      if (response.ok) {
        toast.success("Review salva com sucesso!");
      } else {
        const errorData = await response.json();
        console.error(errorData);
        toast.error("Erro ao salvar review.");
      }
    } catch (error) {
      toast.error("Falha na conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white font-pixel">CARREGANDO DADOS...</div>;
  }

  if (!game) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-20">
      <div 
        className="fixed inset-0 z-0 opacity-20 blur-sm"
        style={{ backgroundImage: `url(${game.image.medium_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8">
        <Button onClick={() => navigate("/home")} variant="ghost" className="mb-6 text-gray-400 hover:text-white hover:bg-white/10 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="bg-[#121214]/90 border border-[#3bbe5d]/30 rounded-xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
              <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-[#3bbe5d]/20 shadow-[0_0_20px_rgba(59,190,93,0.1)]">
                <img src={game.image.medium_url} alt={game.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black font-pixel text-white tracking-wide mb-2">{game.name}</h1>
                <div className="h-1 w-20 bg-[#3bbe5d] rounded-full" />
              </div>
              <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                <h3 className="text-[#3bbe5d] font-bold font-pixel mb-2 text-sm tracking-wider">DESCRIÇÃO</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                  {game.deck || "Sem descrição disponível para este jogo."}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#3bbe5d]/30 to-transparent my-10" />

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-4">
              {(Object.keys(defaultReviewState) as Array<keyof ReviewForm>).map((key) => (
                <div key={key} className="flex flex-col items-center group">
                  <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                    <CircularProgress value={review[key]} max={10} size={90} strokeWidth={8} icon={icons[key]} showValue={true} />
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={review[key]} onChange={(e) => handleReviewChange(key, Number(e.target.value))} className="w-full h-2 mt-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#3bbe5d]" />
                  <span className="mt-2 text-xs font-bold text-gray-500 group-hover:text-[#3bbe5d] transition-colors font-pixel uppercase">{key}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-2xl border border-white/5">
              <div className="mb-6 relative">
                <CircularProgress value={averageScore || 0} max={10} size={160} strokeWidth={12} color="#3bbe5d" showValue={false} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-white font-pixel">{averageScore?.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">NOTA FINAL</span>
                </div>
              </div>

              <Button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full max-w-xs h-12 bg-[#3bbe5d] hover:bg-[#2ea64d] text-black font-bold font-pixel text-lg shadow-[0_0_20px_rgba(59,190,93,0.3)] hover:shadow-[0_0_30px_rgba(59,190,93,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "SALVANDO..." : "SALVAR REVIEW"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;