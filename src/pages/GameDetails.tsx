import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ArrowLeft, MessageSquare, Heart, Send, User as UserIcon, 
  Gamepad2, Users, ShoppingCart, MonitorPlay, 
  Trophy, TrendingUp, Star 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// --- TIPOS ---
type SteamData = {
  store_link: string;
  price_overview?: {
    final_formatted: string;
    discount_percent: number;
    initial_formatted: string;
  } | null;
  is_free: boolean;
  current_players: number;
  metacritic?: { score: number };
  header_image?: string;
};

type GameDetails = {
  id: number; 
  name: string;
  deck: string; 
  image: { medium_url: string; original_url: string; };
  genres?: { name: string }[]; 
  screenshots?: string[];
  steam_data?: SteamData;
  community_stats?: {
    average_score: number;
    total_reviews: number;
  };
};

type ReviewForm = {
  jogabilidade: number;
  graficos: number;
  narrativa: number;
  audio: number;
  desempenho: number;
};

type CommentData = {
  id: number;
  content: string;
  created_at: string;
  likes: number;
  user_liked: boolean;
  game_name?: string;
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar_url: string;
  };
};

const defaultReviewState = {
  jogabilidade: 5,
  graficos: 5,
  narrativa: 5,
  audio: 5,
  desempenho: 5,
};

// --- COMPONENTE VISUAL: CÍRCULO DE NOTA ---
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
    <div className="relative flex flex-col items-center gap-2 group cursor-pointer">
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle stroke="#1a1a1a" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
          <circle stroke={color} fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2}
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }}
            strokeLinecap="round"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
            {icon && <div className="mb-1 text-gray-400 group-hover:text-white transition-colors">{icon}</div>}
            <span className="text-sm font-black font-pixel text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">{value}</span>
          </div>
        )}
      </div>
      {label && <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider font-pixel group-hover:text-primary transition-colors">{label}</span>}
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
const GameDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // REFERÊNCIA PARA SCROLL
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  const [game, setGame] = useState<GameDetails | null>(null);
  const [review, setReview] = useState<ReviewForm>(defaultReviewState);
  
  const [discussionInfo, setDiscussionInfo] = useState<{ total: number, top_comment: CommentData | null }>({ total: 0, top_comment: null });
  const [allComments, setAllComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const icons: Record<string, JSX.Element> = {
    jogabilidade: <Gamepad2 className="w-4 h-4" />,
    graficos: <MonitorPlay className="w-4 h-4" />,
    narrativa: <Trophy className="w-4 h-4" />,
    audio: <div className="w-4 h-4 flex items-center justify-center font-bold">♫</div>,
    desempenho: <TrendingUp className="w-4 h-4" />
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const userId = localStorage.getItem("userId") || "-1"; 

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
      }

      const discussRes = await fetch(`/api/game/${id}/discussion?user_id=${userId}`);
      if (discussRes.ok) {
        setDiscussionInfo(await discussRes.json());
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar informações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, navigate]);

  useEffect(() => {
    if (isCommentsOpen && id) {
        const userId = localStorage.getItem("userId") || "-1";
        fetch(`/api/game/${id}/comments/all?user_id=${userId}`)
            .then(res => res.json())
            .then(data => setAllComments(data));
    }
  }, [isCommentsOpen, id]);

  const handleReviewChange = (key: keyof ReviewForm, value: number) => {
    setReview({ ...review, [key]: value });
  };

  const calculateUserAverage = () => {
    const scores = Object.values(review);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  // FUNÇÃO PARA ROLAR ATÉ A AVALIAÇÃO
  const scrollToReview = () => {
    reviewSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitReview = async () => {
    if (!game) return;
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Você precisa estar logado para avaliar!");
      navigate("/");
      return;
    }

    setIsSubmitting(true);
    const genreName = game.genres && game.genres.length > 0 ? game.genres[0].name : "Desconhecido";

    const reviewData = { 
      ...review, 
      game_id: game.id, 
      game_name: game.name,
      game_image_url: game.image?.medium_url || "",
      genre: genreName, 
      owner_id: parseInt(userId)
    };
    
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      
      if (response.ok) {
        toast.success("Avaliação salva!");
        loadData();
      } else {
        toast.error("Erro ao salvar review.");
      }
    } catch (error) {
      toast.error("Falha na conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostComment = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) { toast.error("Faça login para comentar."); return; }
    if (!newComment.trim()) return;

    try {
        const res = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_id: game?.id, user_id: parseInt(userId), content: newComment })
        });
        if (res.ok) {
            toast.success("Comentário enviado!");
            setNewComment("");
            loadData();
            if (isCommentsOpen) {
                const allRes = await fetch(`/api/game/${id}/comments/all?user_id=${userId}`);
                setAllComments(await allRes.json());
            }
        }
    } catch (e) { console.error(e); }
  };

  const handleLike = async (commentId: number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) { toast.error("Faça login para curtir."); return; }

    try {
        const res = await fetch(`/api/comments/${commentId}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: parseInt(userId), comment_id: commentId })
        });

        if (res.ok) {
            const updateList = (list: CommentData[]) => list.map(c => {
                if (c.id === commentId) {
                    const liked = !c.user_liked;
                    return { ...c, user_liked: liked, likes: c.likes + (liked ? 1 : -1) };
                }
                return c;
            });
            setAllComments(updateList(allComments));
            if (discussionInfo.top_comment && discussionInfo.top_comment.id === commentId) {
                setDiscussionInfo({ ...discussionInfo, top_comment: updateList([discussionInfo.top_comment])[0] });
            }
        }
    } catch (e) { console.error(e); }
  };

  const openSteamLink = () => {
    if (game?.steam_data?.store_link) {
      window.open(game.steam_data.store_link, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("Link da loja indisponível");
    }
  };

  const CommentItem = ({ comment, isHighlight = false }: { comment: CommentData, isHighlight?: boolean }) => (
    <div className={`p-4 rounded-xl border flex gap-4 ${isHighlight ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20' : 'bg-[#1a1c1f] border-white/5 mb-3'}`}>
        <div onClick={() => navigate(`/profile/${comment.author.id}`)} className="cursor-pointer">
            <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={comment.author.avatar_url} />
                <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
            </Avatar>
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
                <div>
                    <span onClick={() => navigate(`/profile/${comment.author.id}`)} className="font-bold text-sm text-white hover:text-primary cursor-pointer mr-2">
                        {comment.author.nickname}
                    </span>
                    <span className="text-xs text-gray-500">@{comment.author.username}</span>
                    {isHighlight && <Badge variant="outline" className="ml-2 border-primary/40 text-primary text-[10px] h-5">TOP COMENTÁRIO</Badge>}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => handleLike(comment.id)} className={`p-1 rounded-full transition-colors ${comment.user_liked ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-white'}`}>
                        <Heart className={`w-4 h-4 ${comment.user_liked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-xs font-mono text-gray-400">{comment.likes}</span>
                </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
        </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-primary font-pixel animate-pulse">
       <Gamepad2 className="w-12 h-12 mb-4" />
       <p>CARREGANDO DADOS DO JOGO...</p>
    </div>;
  }

  if (!game) return null;

  const bgImage = game.image?.original_url || game.steam_data?.header_image || game.image?.medium_url;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-20 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <div className="absolute inset-0">
           <img 
             src={bgImage} 
             alt="Background" 
             className="w-full h-full object-cover opacity-60"
             onError={(e) => { e.currentTarget.style.display = 'none'; }}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-12">
            <Button onClick={() => navigate("/home")} variant="ghost" className="absolute top-8 left-4 text-white/70 hover:text-white hover:bg-white/10">
               <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
            </Button>

            <div className="flex flex-col md:flex-row gap-8 items-end">
               <div className="hidden md:block w-52 lg:w-64 aspect-[3/4] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.6)] border-2 border-white/10 overflow-hidden transform translate-y-16 bg-[#1a1c1f]">
                  <img src={game.image.medium_url} alt={game.name} className="w-full h-full object-cover" />
               </div>

               <div className="flex-1 space-y-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                     {game.genres?.map(g => (
                        <Badge key={g.name} className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30">
                           {g.name}
                        </Badge>
                     ))}
                  </div>
                  
                  {/* TÍTULO E BOTÃO DE AVALIAR */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-pixel text-white tracking-tight drop-shadow-lg leading-none">
                         {game.name}
                      </h1>
                      <Button 
                        onClick={scrollToReview} 
                        variant="outline" 
                        className="w-fit border-primary/50 text-primary hover:bg-primary hover:text-black font-bold"
                      >
                        <Star className="w-4 h-4 mr-2 fill-primary" /> AVALIAR
                      </Button>
                  </div>
               </div>

               {/* --- STEAM BOX --- */}
               {game.steam_data && (
                  <div className="bg-[#171a21]/90 backdrop-blur-md p-5 rounded-xl border border-[#3bbe5d]/20 shadow-xl w-full md:w-auto min-w-[280px]">
                      <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                            <img src="/src/assets/steam.png" className="w-5 h-5 opacity-70" alt="Steam" />
                            Steam Store
                         </div>
                         <div className="flex items-center gap-1.5 text-[#3bbe5d] text-xs font-bold bg-[#3bbe5d]/10 px-2 py-1 rounded">
                            <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3bbe5d] opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3bbe5d]"></span>
                            </span>
                            {(game.steam_data.current_players || 0) > 0 
                               ? `${game.steam_data.current_players.toLocaleString()} JOGANDO` 
                               : "STATUS ONLINE"}
                         </div>
                      </div>
                      
                      <div className="mb-4">
                         {game.steam_data.is_free ? (
                            <span className="text-2xl font-bold text-white">GRATUITO</span>
                         ) : (
                            <div className="flex items-end gap-2">
                               {game.steam_data.price_overview?.discount_percent ? (
                                  <span className="bg-[#4c6b22] text-[#a4d007] px-2 py-0.5 rounded text-sm font-bold">
                                      -{game.steam_data.price_overview.discount_percent}%
                                  </span>
                               ) : null}
                               <span className="text-2xl font-bold text-white">
                                  {game.steam_data.price_overview?.final_formatted || "Ver na Steam"}
                               </span>
                            </div>
                         )}
                      </div>

                      <Button 
                        onClick={openSteamLink}
                        className="w-full bg-gradient-to-r from-[#4754a2] to-[#6a87d6] hover:from-[#5664b6] hover:to-[#7a96e3] text-white font-bold h-10 shadow-lg transition-all hover:scale-105"
                      >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {game.steam_data.is_free ? "JOGAR AGORA" : "COMPRAR / BAIXAR"}
                      </Button>
                  </div>
               )}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
           {game.screenshots && game.screenshots.length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-xl font-bold font-pixel text-primary flex items-center gap-2">
                    <MonitorPlay className="w-5 h-5" /> GALERIA
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    {game.screenshots.map((shot, idx) => (
                       <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-all group">
                          <img src={shot} alt="Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       </div>
                    ))}
                 </div>
              </div>
           )}

           <div className="bg-[#121214] p-6 rounded-xl border border-white/5">
              <h3 className="text-xl font-bold font-pixel text-white mb-4">SOBRE O JOGO</h3>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm md:text-base">
                 {game.deck || "Nenhuma descrição disponível."}
              </p>
           </div>

           {/* REFERÊNCIA ADICIONADA AQUI */}
           <div ref={reviewSectionRef} className="bg-[#121214] p-8 rounded-xl border border-primary/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Gamepad2 className="w-64 h-64 text-primary" />
               </div>

               <h3 className="text-2xl font-bold font-pixel text-white mb-8 relative z-10">SUA ANÁLISE</h3>
               
               <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-10 mb-8">
                  {(Object.keys(defaultReviewState) as Array<keyof ReviewForm>).map((key) => (
                     <div key={key} className="flex flex-col items-center">
                        <CircularProgress 
                           value={review[key]} 
                           max={10} 
                           size={70} 
                           strokeWidth={6} 
                           label={key}
                           icon={icons[key]}
                        />
                        <input 
                           type="range" 
                           min="0" 
                           max="10" 
                           step="0.5" 
                           value={review[key]} 
                           onChange={(e) => handleReviewChange(key, Number(e.target.value))} 
                           className="w-full h-1.5 mt-4 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80" 
                        />
                     </div>
                  ))}
               </div>

               <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
                   <div className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Sua Nota Final</p>
                          <p className="text-3xl font-black font-pixel text-primary">{calculateUserAverage().toFixed(1)}</p>
                       </div>
                       <div className="h-10 w-px bg-white/10 mx-2" />
                       <Button 
                          onClick={handleSubmitReview} 
                          disabled={isSubmitting} 
                          className="bg-primary hover:bg-primary/80 text-black font-bold font-pixel px-8"
                       >
                          {isSubmitting ? "SALVANDO..." : "PUBLICAR REVIEW"}
                       </Button>
                   </div>
               </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-[#121214] rounded-xl border border-white/10 overflow-hidden">
               <div className="bg-white/5 p-4 border-b border-white/5">
                   <h3 className="font-bold font-pixel text-white flex items-center gap-2">
                       <Users className="w-4 h-4 text-primary" />
                       MÉDIA DA COMUNIDADE
                   </h3>
               </div>
               <div className="p-6 flex flex-col items-center">
                   <div className="relative mb-4">
                       <CircularProgress 
                          value={game.community_stats?.average_score || 0} 
                          max={10} 
                          size={140} 
                          strokeWidth={10} 
                          color={ (game.community_stats?.average_score || 0) >= 7 ? '#3bbe5d' : (game.community_stats?.average_score || 0) >= 4 ? '#eab308' : '#ef4444' }
                          showValue={false}
                       />
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black font-pixel text-white">
                             {(game.community_stats?.average_score || 0).toFixed(1)}
                          </span>
                       </div>
                   </div>
                   <p className="text-sm text-gray-500 font-medium">
                      Baseado em <span className="text-white font-bold">{game.community_stats?.total_reviews || 0}</span> análises
                   </p>
               </div>
           </div>

           <div className="bg-[#121214] rounded-xl border border-white/10 overflow-hidden flex flex-col h-fit">
               <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
                   <h3 className="font-bold font-pixel text-white flex items-center gap-2">
                       <MessageSquare className="w-4 h-4 text-primary" />
                       DISCUSSÃO
                   </h3>
                   <span className="text-xs bg-black/50 px-2 py-0.5 rounded text-gray-400">
                      {discussionInfo.total} posts
                   </span>
               </div>
               
               <div className="p-4 flex-1 flex flex-col">
                  {discussionInfo.top_comment ? (
                      <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">Em Destaque</p>
                          <CommentItem comment={discussionInfo.top_comment} isHighlight={true} />
                      </div>
                  ) : (
                      <div className="text-center py-6">
                          <p className="text-sm text-gray-500">Seja o primeiro a comentar!</p>
                      </div>
                  )}

                  <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10 hover:text-primary mt-auto">
                              {discussionInfo.total > 0 ? "Ver toda a discussão" : "Iniciar discussão"}
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a1c1f] border-primary/20 text-white max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                          <DialogHeader className="p-6 bg-[#121214] border-b border-white/5">
                              <DialogTitle className="font-pixel text-primary flex items-center gap-2">
                                  <MessageSquare className="w-5 h-5" /> 
                                  Comentários: {game.name}
                              </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="flex-1 p-6">
                              {allComments.length > 0 ? (
                                  allComments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                              ) : (
                                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                      <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                                      <p>Nenhum comentário ainda.</p>
                                  </div>
                              )}
                          </ScrollArea>

                          <div className="p-4 bg-[#121214] border-t border-white/5 flex gap-2">
                              <Textarea 
                                  placeholder="Escreva sua opinião sobre o jogo..." 
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="bg-black/30 border-white/10 text-white resize-none min-h-[50px] max-h-[100px]"
                              />
                              <Button onClick={handlePostComment} className="bg-primary text-black hover:bg-primary/80 h-auto px-4">
                                  <Send className="w-5 h-5" />
                              </Button>
                          </div>
                      </DialogContent>
                  </Dialog>
               </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default GameDetails;