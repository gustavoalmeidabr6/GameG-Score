import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom"; 
import { 
  ArrowLeft, Edit, TrendingUp, Star, Award, ExternalLink, 
  Trophy, Medal, Zap, Crown, Flame, Link as LinkIcon, Frown, 
  Gamepad2, List, Trash2, MessageSquare, Heart, Quote,
  Shield, Eye, Headphones, Book, Cpu, Sword, Map, Scale, AlertTriangle,
  Loader2, HelpCircle, Save, CheckCircle2, XCircle, BrainCircuit, Users,
  Swords, MousePointerClick
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart } from "@/components/RadarChart";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import welcomeBg from "@/assets/welcome-bg.jpg";
import { toast } from "sonner";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// Logos
import steamLogo from "@/assets/steam.png";
import xboxLogo from "@/assets/xbox.png";
import psnLogo from "@/assets/psn.png";
import epicLogo from "@/assets/epic.png";

// Interfaces para o Quiz Avançado
type QuizStage = {
  id: number;
  type: 'multiple_choice' | 'slider' | 'versus' | 'genre';
  question: string;
  // Propriedades variáveis dependendo do tipo
  options?: any[];
  correct_id?: number;
  correct_answer?: string;
  correct_score?: number;
  game_name?: string;
  game_image?: string;
  option_a?: any;
  option_b?: any;
};

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams(); 
  
  const [profile, setProfile] = useState<any>(null);
  
  // Dados secundários
  const [allGames, setAllGames] = useState<any[]>([]);
  const [allTierlists, setAllTierlists] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [bestComment, setBestComment] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]); // Novo: Conexões

  // Quiz Data e Estados Avançados
  const [quizQuestions, setQuizQuestions] = useState<QuizStage[]>([]); // Alterado para receber lista plana
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  
  // Estados de Interação do Quiz
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [selectedOptionId, setSelectedOptionId] = useState<number | string | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([5.0]);
  const [versusSelected, setVersusSelected] = useState<number | null>(null);

  // Estados de carregamento
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSecondary, setLoadingSecondary] = useState(true);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [favoritesDialogOpen, setFavoritesDialogOpen] = useState(false);
  const [selectedFavorites, setSelectedFavorites] = useState<number[]>([]);
  const [isOwner, setIsOwner] = useState(false); 

  // Tab State
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProfile = async () => {
    const loggedUserId = localStorage.getItem("userId");
    if (!loggedUserId) {
      navigate("/");
      return;
    }

    const targetId = userId || loggedUserId;
    setIsOwner(targetId === loggedUserId);
    setLoadingProfile(true); 

    try {
      // 1. PRIORITY FETCH
      const response = await fetch(`/api/profile/${targetId}`);
      if (response.status === 404) {
        toast.error("Usuário não encontrado.");
        navigate("/home");
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setLoadingProfile(false); 
      }

      // 2. BACKGROUND FETCH
      setLoadingSecondary(true);
      
      const [gamesRes, tierRes, bestCommentRes, allCommentsRes, connRes] = await Promise.all([
        fetch(`/api/user_games/${targetId}`),
        fetch(`/api/tierlists/${targetId}`),
        fetch(`/api/user/${targetId}/best_comment`),
        fetch(`/api/user/${targetId}/comments`),
        fetch(`/api/connections/${targetId}`) // Trazendo as conexões
      ]);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        // Ordenar por nota
        gamesData.sort((a: any, b: any) => (b.nota_geral || 0) - (a.nota_geral || 0));
        setAllGames(gamesData);
        // Preencher favoritos para edição
        const favs = gamesData.filter((g: any) => g.is_favorite).map((g: any) => g.id);
        setSelectedFavorites(favs);
      }

      if (tierRes.ok) setAllTierlists(await tierRes.json());
      if (bestCommentRes.ok) setBestComment(await bestCommentRes.json());
      if (allCommentsRes.ok) setUserComments(await allCommentsRes.json());
      if (connRes.ok) setConnections(await connRes.json());

      // 3. FETCH QUIZ AVANÇADO
      setQuizLoading(true);
      fetch(`/api/quiz/${targetId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.error && Array.isArray(data)) {
                setQuizQuestions(data);
            }
        })
        .catch(err => console.error("Erro Quiz:", err))
        .finally(() => setQuizLoading(false));

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoadingProfile(false);
      setLoadingSecondary(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate, userId]); 

  const handleSaveFavorites = async () => {
    if (selectedFavorites.length > 3) {
        toast.error("Escolha no máximo 3 jogos.");
        return;
    }
    const loggedUserId = localStorage.getItem("userId");
    try {
        const res = await fetch("/api/profile/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: parseInt(loggedUserId!), game_ids: selectedFavorites })
        });
        if (res.ok) {
            toast.success("Favoritos atualizados!");
            setFavoritesDialogOpen(false);
            fetchProfile(); 
        }
    } catch (e) { toast.error("Erro ao salvar."); }
  };

  const handleDeleteTierlist = async (tierlistId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta Tierlist?")) return;
    const loggedUserId = localStorage.getItem("userId");
    try {
      const res = await fetch(`/api/tierlist/${tierlistId}?owner_id=${loggedUserId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tierlist excluída!");
        setAllTierlists(prev => prev.filter(t => t.id !== tierlistId));
      } else {
        const err = await res.json();
        toast.error(err.detail || "Erro ao excluir");
      }
    } catch (e) { toast.error("Erro de conexão"); }
  };

  // --- LÓGICA DE RESPOSTA DO QUIZ (UNIFICADA) ---
  const handleAnswer = (correct: boolean) => {
      if (answerState !== 'idle') return;

      setAnswerState(correct ? 'correct' : 'incorrect');
      if (correct) setQuizScore(prev => prev + 1);

      // Delay para próxima etapa
      setTimeout(() => {
          if (currentQuestionIndex + 1 < quizQuestions.length) {
              setCurrentQuestionIndex(prev => prev + 1);
              setAnswerState('idle');
              setSelectedOptionId(null);
              setVersusSelected(null);
              setSliderValue([5.0]);
          } else {
              setQuizFinished(true);
          }
      }, 1500);
  };

  // 1. Lógica para Múltipla Escolha / Gênero
  const handleOptionClick = (val: number | string, correctVal: number | string) => {
      setSelectedOptionId(val);
      handleAnswer(val === correctVal);
  };

  // 2. Lógica para Versus
  const handleVersusClick = (id: number, correctId: number) => {
      setVersusSelected(id);
      handleAnswer(id === correctId);
  };

  // 3. Lógica para Slider
  const handleSliderConfirm = (correctScore: number) => {
      const val = sliderValue[0];
      const diff = Math.abs(val - correctScore);
      // Margem de erro de 0.5 é aceitável como "correto"
      const isCorrect = diff <= 0.5;
      handleAnswer(isCorrect);
  };

  const getQuizResultData = () => {
      if (quizQuestions.length === 0) return { percentage: 0, message: "", color: "" };
      
      const percentage = Math.round((quizScore / quizQuestions.length) * 100);
      let message = "";
      let color = "";

      if (percentage === 100) { message = "VOCÊ SABE TUDO! 🤯"; color = "text-yellow-400"; }
      else if (percentage >= 75) { message = "Melhores Amigos! 💖"; color = "text-green-400"; }
      else if (percentage >= 50) { message = "Conhece bem! 👍"; color = "text-blue-400"; }
      else { message = "Precisa stalkear mais... 🕵️"; color = "text-red-400"; }

      return { percentage, message, color };
  };

  if (loadingProfile || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-primary font-pixel animate-pulse">
         <Gamepad2 className="w-12 h-12 mb-4" />
         <p>CARREGANDO PERFIL...</p>
      </div>
    );
  }

  const userAverage = profile.stats?.average_score 
    ? Number(profile.stats.average_score).toFixed(1) 
    : "0.0";

  const ACHIEVEMENTS_LIST = [
    { key: "first_review", title: "Primeiros Passos", desc: "Avalie o primeiro jogo", icon: <Star className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "five_reviews", title: "Crítico em Ascensão", desc: "Avalie 5 jogos", icon: <TrendingUp className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "ten_reviews", title: "Crítico de Elite", desc: "Avalie 10 jogos", icon: <Medal className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "fps_king", title: "Rei do FPS", desc: "20+ jogos de Tiro", icon: <Flame className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "high_score", title: "Nota Máxima", desc: "Dê nota 10 em uma categoria", icon: <Zap className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "perfect_game", title: "Perfeccionista", desc: "Jogo perfeito (10 em tudo)", icon: <Crown className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "hater", title: "Exigente", desc: "Nota geral menor que 3", icon: <Frown className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "connected", title: "Conectado", desc: "Adicionou uma rede social", icon: <LinkIcon className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "veteran", title: "Veterano", desc: "Nível 5", icon: <Trophy className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "visual_master", title: "Olhos de Águia", desc: "Deu 10 em Gráficos", icon: <Eye className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "audio_master", title: "Audiófilo", desc: "Deu 10 em Áudio", icon: <Headphones className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "narrative_master", title: "Leitor Voraz", desc: "Deu 10 em Narrativa", icon: <Book className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "gameplay_master", title: "Tryhard", desc: "Deu 10 em Jogabilidade", icon: <Gamepad2 className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "performance_master", title: "60 FPS", desc: "Deu 10 em Desempenho", icon: <Cpu className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "social_star", title: "Influencer", desc: "Todas redes conectadas", icon: <Trophy className="w-6 h-6 text-[#ffd700]" /> },
    { key: "elite_gamer", title: "Lenda Viva", desc: "Nível 10 alcançado", icon: <Crown className="w-6 h-6 text-[#ffd700]" /> },
    { key: "balanced", title: "Equilibrado", desc: "Deu nota exata 5.0", icon: <Scale className="w-6 h-6 text-[#3bbe5d]" /> },
    { key: "pure_love", title: "Amor Puro", desc: "Deu 10 na Nota Final", icon: <Heart className="w-6 h-6 text-[#ff0000]" /> },
  ];

  const unlockedAchievements = ACHIEVEMENTS_LIST.filter(ach => profile.achievements && profile.achievements[ach.key]);
  
  const attributeLabels: Record<string, string> = {
    jogabilidade: "Jogabilidade",
    graficos: "Gráficos",
    narrativa: "Narrativa",
    audio: "Áudio",
    desempenho: "Desempenho",
  };

  return (
    <div className="min-h-screen relative text-white p-6 font-sans bg-[#0A0A0A]">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${welcomeBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/80" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/home")} className="text-primary hover:text-primary/80 hover:bg-primary/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            {isOwner && (
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="border-primary text-primary h-8 text-xs">
                    <Edit className="mr-2 h-3 w-3" /> Editar Perfil
                </Button>
            )}
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          
          <ProfileHeader 
             username={profile.nickname || profile.username} 
             level={profile.level}
             rank={`XP: ${profile.xp}`} 
             avatarUrl={profile.avatar_url}
             bannerUrl={profile.banner_url}
             xp={profile.xp}
             bio={profile.bio || "Insira sua bio"} 
          />

          {/* SEÇÃO: CÍRCULO PRÓXIMO (CONEXÕES COMPATÍVEIS) */}
          {connections.length > 0 && (
            <div className="mb-4 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users className="w-3 h-3 text-primary" /> Círculo Próximo
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {connections.map((friend: any) => (
                        <Link to={`/profile/${friend.id}`} key={friend.id} className="min-w-[180px] bg-black/40 border border-white/5 p-3 rounded-lg flex items-center gap-3 hover:border-primary/40 hover:bg-white/5 transition-all">
                            <div className="relative">
                                <Avatar className="h-10 w-10 border border-white/10">
                                    <AvatarImage src={friend.avatar_url} />
                                    <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-black text-[8px] px-1 rounded text-primary border border-primary/20">Lv.{friend.level}</div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-xs text-white truncate">{friend.nickname || friend.username}</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-green-400">{friend.compatibility}% Match</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-black/60 border border-primary/20 p-1 grid grid-cols-5 w-full max-w-4xl h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm py-2">
                   <Award className="w-4 h-4 mr-2 hidden md:inline" /> Visão Geral
                </TabsTrigger>
                <TabsTrigger value="steam" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm py-2">
                   <LinkIcon className="w-4 h-4 mr-2 hidden md:inline" /> Redes
                </TabsTrigger>
                <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm py-2">
                   <Gamepad2 className="w-4 h-4 mr-2 hidden md:inline" /> Jogos ({allGames.length})
                </TabsTrigger>
                <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm py-2">
                    <BrainCircuit className="w-4 h-4 mr-2 hidden md:inline" /> Quiz
                </TabsTrigger>
                <TabsTrigger value="tierlists" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-sm py-2">
                   <List className="w-4 h-4 mr-2 hidden md:inline" /> Tierlists ({allTierlists.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* --- VISÃO GERAL --- */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              {loadingSecondary ? (
                 <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : (
                <>
                  {bestComment && (
                    <div className="glass-panel rounded-xl border border-primary/30 p-6 bg-black/60 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Quote className="w-24 h-24 text-primary" />
                        </div>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Heart className="w-4 h-4 fill-primary" /> Maior Contribuição ({bestComment.likes} Likes)
                        </h3>
                        <div className="relative z-10">
                            <p className="text-xl md:text-2xl font-serif italic text-white mb-4">"{bestComment.content}"</p>
                            <Link to={`/game/${bestComment.game_id}`} className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" />
                                Em: <span className="font-bold underline">{bestComment.game_name}</span>
                            </Link>
                        </div>
                    </div>
                  )}

                  <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60 relative">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel flex-1 text-center">
                        {isOwner ? "Meus Favoritos (Top 3)" : `Top 3 de ${profile.nickname || profile.username}`}
                        </h2>
                        {isOwner && (
                            <div className="absolute right-8 top-8">
                                <Dialog open={favoritesDialogOpen} onOpenChange={setFavoritesDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/20">
                                            <Edit className="w-4 h-4 mr-2" /> Editar
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#1a1c1f] border-primary/20 text-white max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle className="text-primary font-pixel">Escolha seus 3 Favoritos</DialogTitle>
                                        </DialogHeader>
                                        <ScrollArea className="h-[300px] pr-4">
                                            <div className="space-y-2">
                                                {allGames.map(game => (
                                                    <div key={game.id} className="flex items-center space-x-3 p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
                                                        <Checkbox 
                                                            id={`game-${game.id}`}
                                                            checked={selectedFavorites.includes(game.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    if (selectedFavorites.length < 3) setSelectedFavorites([...selectedFavorites, game.id]);
                                                                    else toast.error("Máximo de 3 jogos!");
                                                                } else {
                                                                    setSelectedFavorites(selectedFavorites.filter(id => id !== game.id));
                                                                }
                                                            }}
                                                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                                        />
                                                        <label htmlFor={`game-${game.id}`} className="text-sm font-medium leading-none flex-1 cursor-pointer">
                                                            {game.title}
                                                        </label>
                                                        <span className="text-xs text-gray-500 font-mono">{game.nota_geral.toFixed(1)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <Button onClick={handleSaveFavorites} className="w-full bg-primary text-black hover:bg-primary/80 font-bold mt-4">
                                            <Save className="w-4 h-4 mr-2" /> Salvar Escolhas
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>

                    {profile.top_favorites && profile.top_favorites.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {profile.top_favorites.map((game: any, index: number) => (
                          <div key={index} className="rounded-xl border border-primary/20 p-6 relative overflow-hidden group h-[400px] flex flex-col justify-between">
                            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500" style={{ backgroundImage: `url(${game.game_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                            <div className="relative z-10 flex flex-col items-center h-full">
                              <h3 className="text-lg font-bold text-white text-center mb-4 font-pixel truncate w-full px-2">{game.game_name}</h3>
                              <div className="flex-grow flex items-center justify-center w-full">
                                <RadarChart data={{ jogabilidade: game.jogabilidade, graficos: game.graficos, narrativa: game.narrativa, audio: game.audio, desempenho: game.desempenho }} size={180} showLabels={true} />
                              </div>
                              <div className="mt-4 bg-primary/20 px-4 py-2 rounded-full border border-primary/50">
                                <span className="text-xl font-black text-primary font-pixel">{game.nota_geral.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400">Nenhum jogo favorito selecionado.</div>
                    )}
                  </div>

                   {/* CALL TO ACTION QUIZ */}
                   {quizQuestions.length > 0 && (
                      <div className="w-full cursor-pointer" onClick={() => setActiveTab("quiz")}>
                          <div className="group relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-black/60 p-6 hover:border-primary transition-all duration-300">
                             <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                   <div className="bg-primary/20 p-3 rounded-full">
                                      <BrainCircuit className="w-8 h-8 text-primary" />
                                   </div>
                                   <div>
                                      <h3 className="text-lg font-black text-white uppercase font-pixel">
                                          Você conhece {profile.nickname}?
                                      </h3>
                                      <p className="text-gray-400 text-sm">Responda 10 perguntas geradas por IA sobre este perfil!</p>
                                   </div>
                                </div>
                                <Button className="bg-primary text-black font-bold hover:bg-primary/80">
                                    Jogar Agora
                                </Button>
                             </div>
                          </div>
                      </div>
                   )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-panel rounded-xl border border-primary/20 p-6 bg-black/60">
                      <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">Estatísticas</h2>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center">
                          <TrendingUp className="h-6 w-6 text-primary mb-2" />
                          <p className="text-3xl font-black text-white font-pixel">{profile.stats.reviews_count}</p>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Jogos</p>
                        </div>
                        <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center">
                          <Star className="h-6 w-6 text-primary mb-2" />
                          <p className="text-3xl font-black text-white font-pixel">{userAverage}</p>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Média</p>
                        </div>
                        <div className="rounded-lg border border-primary/10 p-4 bg-white/5 flex flex-col items-center justify-center text-center">
                          <Award className="h-6 w-6 text-primary mb-2" />
                          <p className="text-sm font-bold text-white font-pixel mt-1 truncate px-2 w-full">
                            {profile.stats.favorite_genre || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Gênero</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-xl border border-primary/20 p-6 bg-black/60 flex flex-col justify-center items-center text-center">
                       <h2 className="text-lg font-black text-primary uppercase tracking-wider mb-4 font-pixel">Conquistas</h2>
                       <div className="text-4xl font-black text-white mb-2 font-pixel">
                          {unlockedAchievements.length} <span className="text-base text-gray-500 font-sans font-normal">/ {ACHIEVEMENTS_LIST.length}</span>
                       </div>
                       <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS_LIST.length) * 100}%` }} />
                       </div>
                       <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {unlockedAchievements.slice(0, 5).map(ach => (
                             <div key={ach.key} title={ach.title} className="bg-white/5 p-2 rounded-lg border border-white/10 hover:border-primary/50 transition-colors">
                                {ach.icon}
                             </div>
                          ))}
                          {unlockedAchievements.length > 5 && (
                             <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-xs flex items-center justify-center font-bold text-gray-500">
                                +{unlockedAchievements.length - 5}
                             </div>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60">
                    <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-pixel mb-8 text-center">
                      Melhores por Atributo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.best_by_attribute && Object.entries(profile.best_by_attribute).map(([attribute, games]: [string, any]) => {
                        if (games.length === 0) return null;
                        return (
                          <div key={attribute} className="glass-panel rounded-xl border border-primary/20 p-6 bg-white/5">
                            <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 text-center">
                              {attributeLabels[attribute] || attribute}
                            </h3>
                            <div className="space-y-3">
                              {games.map((game: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 glass-panel rounded-lg border border-primary/10 bg-black/40">
                                  <span className="text-sm text-gray-200 font-medium truncate mr-2 w-2/3">{game.title}</span>
                                  <span className="text-lg font-black text-primary">{game.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* --- REDES & STEAM --- */}
            <TabsContent value="steam" className="animate-fade-in space-y-6">
                <div className="glass-panel rounded-2xl border-2 border-[#1b2838] bg-[#0f1114] p-8 min-h-[50vh] flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Redes Conectadas</h2>
                    <p className="text-gray-400 mb-10 text-center max-w-lg">
                       Acesse os perfis oficiais de jogos deste usuário clicando nos cards abaixo.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        
                        {/* STEAM */}
                        {profile.social.steam ? (
                           <a href={profile.social.steam} target="_blank" rel="noreferrer" 
                              className="group bg-[#171a21] border border-white/10 p-6 rounded-xl flex items-center gap-4 hover:border-[#66c0f4] hover:bg-[#1b2838] transition-all cursor-pointer">
                              <img src={steamLogo} className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div>
                                 <h3 className="text-xl font-bold text-white group-hover:text-[#66c0f4]">Steam</h3>
                                 <p className="text-sm text-gray-400 flex items-center gap-1 group-hover:text-white">
                                    Ver Perfil <ExternalLink className="w-3 h-3" />
                                 </p>
                              </div>
                           </a>
                        ) : (
                           <div className="bg-[#171a21]/50 border border-white/5 p-6 rounded-xl flex items-center gap-4 opacity-50 grayscale">
                              <img src={steamLogo} className="w-16 h-16" />
                              <div>
                                 <h3 className="text-xl font-bold text-gray-500">Steam</h3>
                                 <p className="text-sm text-gray-600">Não vinculado</p>
                              </div>
                           </div>
                        )}

                        {/* XBOX */}
                        {profile.social.xbox ? (
                           <a href={profile.social.xbox} target="_blank" rel="noreferrer" 
                              className="group bg-[#107c10]/10 border border-white/10 p-6 rounded-xl flex items-center gap-4 hover:border-[#107c10] hover:bg-[#107c10]/20 transition-all cursor-pointer">
                              <img src={xboxLogo} className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div>
                                 <h3 className="text-xl font-bold text-white group-hover:text-[#107c10]">Xbox Live</h3>
                                 <p className="text-sm text-gray-400 flex items-center gap-1 group-hover:text-white">
                                    Ver Perfil <ExternalLink className="w-3 h-3" />
                                 </p>
                              </div>
                           </a>
                        ) : (
                           <div className="bg-[#171a21]/50 border border-white/5 p-6 rounded-xl flex items-center gap-4 opacity-50 grayscale">
                              <img src={xboxLogo} className="w-16 h-16" />
                              <div>
                                 <h3 className="text-xl font-bold text-gray-500">Xbox</h3>
                                 <p className="text-sm text-gray-600">Não vinculado</p>
                              </div>
                           </div>
                        )}

                        {/* PSN */}
                        {profile.social.psn ? (
                           <a href={profile.social.psn} target="_blank" rel="noreferrer" 
                              className="group bg-[#003791]/10 border border-white/10 p-6 rounded-xl flex items-center gap-4 hover:border-[#0070d1] hover:bg-[#003791]/20 transition-all cursor-pointer">
                              <img src={psnLogo} className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div>
                                 <h3 className="text-xl font-bold text-white group-hover:text-[#0070d1]">PlayStation</h3>
                                 <p className="text-sm text-gray-400 flex items-center gap-1 group-hover:text-white">
                                    Ver Perfil <ExternalLink className="w-3 h-3" />
                                 </p>
                              </div>
                           </a>
                        ) : (
                           <div className="bg-[#171a21]/50 border border-white/5 p-6 rounded-xl flex items-center gap-4 opacity-50 grayscale">
                              <img src={psnLogo} className="w-16 h-16" />
                              <div>
                                 <h3 className="text-xl font-bold text-gray-500">PlayStation</h3>
                                 <p className="text-sm text-gray-600">Não vinculado</p>
                              </div>
                           </div>
                        )}

                        {/* EPIC */}
                        {profile.social.epic ? (
                           <a href={profile.social.epic} target="_blank" rel="noreferrer" 
                              className="group bg-[#333]/30 border border-white/10 p-6 rounded-xl flex items-center gap-4 hover:border-white hover:bg-black transition-all cursor-pointer">
                              <img src={epicLogo} className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div>
                                 <h3 className="text-xl font-bold text-white">Epic Games</h3>
                                 <p className="text-sm text-gray-400 flex items-center gap-1 group-hover:text-white">
                                    Ver Perfil <ExternalLink className="w-3 h-3" />
                                 </p>
                              </div>
                           </a>
                        ) : (
                           <div className="bg-[#171a21]/50 border border-white/5 p-6 rounded-xl flex items-center gap-4 opacity-50 grayscale">
                              <img src={epicLogo} className="w-16 h-16" />
                              <div>
                                 <h3 className="text-xl font-bold text-gray-500">Epic Games</h3>
                                 <p className="text-sm text-gray-600">Não vinculado</p>
                              </div>
                           </div>
                        )}

                    </div>
                    
                    {isOwner && (
                        <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="mt-10 border-white/20 text-white hover:bg-white/10">
                           <Edit className="w-4 h-4 mr-2" /> Gerenciar Links
                        </Button>
                    )}
                </div>
            </TabsContent>

            {/* --- QUIZ (10 PERGUNTAS) --- */}
            <TabsContent value="quiz" className="animate-fade-in">
                <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60 min-h-[50vh] flex flex-col items-center justify-center">
                    {!quizFinished ? (
                        quizQuestions.length > 0 ? (
                            <div className="w-full max-w-2xl text-center">
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-2 px-4">
                                        <span className="text-primary font-pixel text-xs uppercase tracking-widest">
                                          QUESTÃO {currentQuestionIndex + 1} / 10
                                        </span>
                                        <span className="text-white font-bold text-xs bg-primary/20 px-2 py-1 rounded">
                                            SCORE: {quizScore}
                                        </span>
                                    </div>
                                    <Progress value={((currentQuestionIndex) / 10) * 100} className="h-1 bg-gray-800" />
                                    
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-8 leading-tight">
                                        {quizQuestions[currentQuestionIndex].question}
                                    </h2>
                                </div>

                                {/* RENDERIZAÇÃO CONDICIONAL */}
                                <div className="mt-8">
                                    {/* SLIDER */}
                                    {quizQuestions[currentQuestionIndex].type === 'slider' ? (
                                        <div className="max-w-md mx-auto bg-white/5 p-6 rounded-2xl border border-white/10">
                                            <div className="w-32 h-44 mx-auto rounded-lg overflow-hidden border border-white/20 shadow-lg mb-6">
                                                <img src={quizQuestions[currentQuestionIndex].game_image} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="px-4">
                                                <div className="flex justify-between text-xs text-gray-500 font-bold uppercase mb-2">
                                                    <span>0.0</span>
                                                    <span>5.0</span>
                                                    <span>10.0</span>
                                                </div>
                                                <Slider
                                                    disabled={answerState !== 'idle'}
                                                    defaultValue={[5.0]}
                                                    max={10}
                                                    step={0.5}
                                                    onValueChange={(vals) => setSliderValue(vals)}
                                                    className="py-4 cursor-grab active:cursor-grabbing"
                                                />
                                                <div className="mt-4 text-center">
                                                    <span className="text-5xl font-black font-pixel text-primary">{sliderValue[0].toFixed(1)}</span>
                                                    <p className="text-xs text-gray-400 mt-1 uppercase">Seu Palpite</p>
                                                </div>
                                            </div>
                                            {answerState === 'idle' ? (
                                                <Button 
                                                    onClick={() => handleSliderConfirm(quizQuestions[currentQuestionIndex].correct_score!)}
                                                    className="w-full mt-6 bg-white text-black font-bold hover:bg-gray-200 h-12"
                                                >
                                                    <MousePointerClick className="w-5 h-5 mr-2" /> CONFIRMAR
                                                </Button>
                                            ) : (
                                                <div className={`mt-6 p-3 rounded-lg border text-center font-bold ${answerState === 'correct' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}>
                                                    Nota Real: {quizQuestions[currentQuestionIndex].correct_score}
                                                </div>
                                            )}
                                        </div>
                                    ) : quizQuestions[currentQuestionIndex].type === 'versus' ? (
                                        // VERSUS
                                        <div className="grid grid-cols-2 gap-4 md:gap-8">
                                            {[quizQuestions[currentQuestionIndex].option_a, quizQuestions[currentQuestionIndex].option_b].map((opt: any) => {
                                                const isSelected = versusSelected === opt.id;
                                                const isCorrect = opt.id === quizQuestions[currentQuestionIndex].correct_id;
                                                
                                                let borderClass = "border-transparent hover:border-primary/50";
                                                if (answerState !== 'idle') {
                                                    if (isCorrect) borderClass = "border-green-500 ring-4 ring-green-500/20 grayscale-0";
                                                    else if (isSelected) borderClass = "border-red-500 opacity-50 grayscale";
                                                    else borderClass = "opacity-30 grayscale";
                                                }

                                                return (
                                                    <div 
                                                        key={opt.id}
                                                        onClick={() => { if (answerState === 'idle') handleVersusClick(opt.id, quizQuestions[currentQuestionIndex].correct_id!); }}
                                                        className={`relative aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-500 border-4 transform ${isSelected ? 'scale-95' : 'hover:scale-105'} ${borderClass}`}
                                                    >
                                                        <img src={opt.image} className="w-full h-full object-cover" />
                                                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                                                            <p className="font-bold text-white text-center leading-tight shadow-black drop-shadow-md">{opt.name}</p>
                                                            {answerState !== 'idle' && (
                                                                <div className={`mt-2 text-center font-black text-xl ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {opt.score.toFixed(1)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {answerState === 'idle' && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                                                                <Swords className="w-12 h-12 text-white drop-shadow-lg" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        // MÚLTIPLA ESCOLHA & GÊNERO
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {quizQuestions[currentQuestionIndex].options?.map((opt: any, idx: number) => {
                                                const val = typeof opt === 'string' ? opt : opt.id;
                                                const label = typeof opt === 'string' ? opt : opt.name;
                                                const image = typeof opt === 'string' ? null : opt.image;
                                                
                                                let btnClass = "border-white/10 bg-black/40 hover:bg-white/5";
                                                if (answerState !== 'idle') {
                                                    const correct = quizQuestions[currentQuestionIndex].type === 'genre' 
                                                        ? quizQuestions[currentQuestionIndex].correct_answer 
                                                        : quizQuestions[currentQuestionIndex].correct_id;
                                                    
                                                    if (val === correct) btnClass = "border-green-500 bg-green-500/20 ring-1 ring-green-500";
                                                    else if (val === selectedOptionId) btnClass = "border-red-500 bg-red-500/20 opacity-50";
                                                    else btnClass = "opacity-30 border-white/5";
                                                }

                                                return (
                                                    <button 
                                                        key={idx}
                                                        disabled={answerState !== 'idle'}
                                                        onClick={() => {
                                                            const correct = quizQuestions[currentQuestionIndex].type === 'genre' 
                                                                ? quizQuestions[currentQuestionIndex].correct_answer 
                                                                : quizQuestions[currentQuestionIndex].correct_id;
                                                            handleOptionClick(val, correct);
                                                        }}
                                                        className={`group relative h-20 md:h-24 rounded-xl overflow-hidden border-2 transition-all flex items-center text-left ${btnClass}`}
                                                    >
                                                        {image && (
                                                            <div className="w-20 md:w-24 h-full flex-shrink-0 border-r border-white/5">
                                                                <img src={image} className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="p-4 flex-1">
                                                            <span className="font-bold text-white group-hover:text-primary transition-colors">{label}</span>
                                                        </div>
                                                        {answerState !== 'idle' && val === (quizQuestions[currentQuestionIndex].type === 'genre' ? quizQuestions[currentQuestionIndex].correct_answer : quizQuestions[currentQuestionIndex].correct_id) && (
                                                            <div className="absolute right-4 bg-green-500 rounded-full p-1"><CheckCircle2 className="w-4 h-4 text-black" /></div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Este usuário ainda não tem jogos suficientes para gerar um quiz (Mínimo 2).</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center animate-scale-in w-full max-w-md">
                            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-glow" />
                            <h2 className="text-4xl font-black text-white font-pixel mb-2">QUIZ FINALIZADO!</h2>
                            
                            <div className={`text-xl font-bold mb-8 ${getQuizResultData().color}`}>
                                {getQuizResultData().message}
                            </div>
                            
                            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-8">
                                <div className="flex justify-between text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">
                                    <span>Nível de Amizade</span>
                                    <span>{getQuizResultData().percentage}%</span>
                                </div>
                                <Progress value={getQuizResultData().percentage} className="h-4 bg-gray-800" indicatorClassName={getQuizResultData().percentage >= 80 ? "bg-green-500" : "bg-primary"} />
                                
                                <div className="mt-6 flex flex-col justify-center items-center">
                                    <span className="text-6xl font-black text-white font-pixel mb-2">{quizScore}/10</span>
                                    <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Acertos</span>
                                </div>
                            </div>

                            <Button onClick={() => {
                                setQuizFinished(false);
                                setCurrentQuestionIndex(0);
                                setQuizScore(0);
                                setAnswerState('idle');
                                setSelectedOptionId(null);
                                setVersusSelected(null);
                                setSliderValue([5.0]);
                            }} className="w-full bg-primary text-black hover:bg-primary/80 font-bold h-12">
                                Tentar Novamente
                            </Button>
                        </div>
                    )}
                </div>
            </TabsContent>

            {/* --- CONTEÚDO: BIBLIOTECA (Todos os jogos) --- */}
            <TabsContent value="library" className="animate-fade-in">
                <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60 min-h-[50vh]">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <span className="text-primary">🎮</span> Biblioteca de Avaliações
                  </h3>
                  
                  {loadingSecondary && allGames.length === 0 ? (
                     <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
                  ) : allGames.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {allGames.map((game) => (
                        <Link key={game.id} to={`/game/${game.id}`} className="block group relative">
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 border border-white/5 bg-gray-900">
                            <img 
                              src={game.cover || "/placeholder.png"} 
                              alt={game.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-2 right-2 bg-black/80 border border-primary text-primary font-black text-xs px-2 py-1 rounded-md shadow-lg z-10">
                               {typeof game.nota_geral === 'number' ? game.nota_geral.toFixed(1) : "?"}
                            </div>
                            {game.is_favorite && (
                                <div className="absolute top-2 left-2 text-yellow-400 z-10 drop-shadow-md">
                                    <Star className="w-5 h-5 fill-current" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-primary font-bold text-sm border border-primary px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">Ver Detalhes</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium truncate text-gray-300 group-hover:text-primary transition-colors">
                            {game.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                       <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                       <p>Este usuário ainda não avaliou nenhum jogo.</p>
                    </div>
                  )}
                </div>
            </TabsContent>

            {/* --- CONTEÚDO: TIERLISTS --- */}
            <TabsContent value="tierlists" className="animate-fade-in">
                <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8 bg-black/60 min-h-[50vh]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-primary">📊</span> Tierlists Criadas
                    </h3>
                    {isOwner && (
                       <Button onClick={() => navigate("/tierlist")} size="sm" className="bg-primary text-black hover:bg-primary/90">
                         Nova Tierlist
                       </Button>
                    )}
                  </div>

                  {loadingSecondary && allTierlists.length === 0 ? (
                     <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
                  ) : allTierlists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {allTierlists.map((tier) => (
                         <div key={tier.id} className="bg-gray-900/50 p-5 rounded-xl border border-white/10 hover:border-primary/50 transition-all group">
                           <div className="flex justify-between items-start mb-4">
                             <h4 className="font-bold text-lg text-white truncate pr-2">{tier.name}</h4>
                             <div className="flex gap-1">
                               {isOwner && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTierlist(tier.id); }}
                                    className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               )}
                             </div>
                           </div>
                           
                           <div className="mt-4">
                              <Button 
                                className="w-full bg-white/5 hover:bg-primary hover:text-black border border-white/10 text-white transition-all"
                                onClick={() => window.location.href = `/tierlist?load=${tier.id}`}
                              >
                                Visualizar
                              </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                       <List className="w-16 h-16 mb-4 opacity-20" />
                       <p>Nenhuma Tierlist criada ainda.</p>
                       {isOwner && <Button variant="link" onClick={() => navigate("/tierlist")} className="text-primary">Criar a primeira</Button>}
                    </div>
                  )}
                </div>
            </TabsContent>

          </Tabs>

        </div>
        
        {isOwner && (
          <EditProfileDialog 
            open={editDialogOpen} 
            onOpenChange={setEditDialogOpen}
            currentBio={profile.bio}
            currentUsername={profile.username}
            currentNickname={profile.nickname}
            currentSocial={profile.social}
            onProfileUpdate={fetchProfile} 
          />
        )}
      </div>
    </div>
  );
}