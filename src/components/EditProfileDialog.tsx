import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <--- IMPORTANTE: Adicionado para mudar a URL
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, User, AtSign, Gamepad2, Image as ImageIcon, Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- IMPORTANDO OS BANNERS ---
import banner1 from "@/assets/BANNER1.png";
import banner2 from "@/assets/BANNER2.png";
import banner3 from "@/assets/BANNER3.png";
import banner4 from "@/assets/BANNER4.png";
import banner5 from "@/assets/BANNER5.png"; 
import banner6 from "@/assets/BANNER6.png"; 
import defaultProfileImg from "@/assets/defaultprofile.png";

// Logos das Redes
const SOCIAL_COLORS = {
    steam: "text-[#66c0f4]",
    xbox: "text-[#107c10]",
    psn: "text-[#0070d1]",
    epic: "text-white"
};

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBio?: string;
  currentUsername?: string;
  currentNickname?: string; 
  currentSocial?: { steam?: string, xbox?: string, psn?: string, epic?: string };
  onProfileUpdate: () => void;
}

const presetBanners = [banner1, banner2, banner3, banner4, banner5, banner6];

export const EditProfileDialog = ({ open, onOpenChange, currentBio, currentUsername, currentNickname, currentSocial, onProfileUpdate }: EditProfileDialogProps) => {
  const navigate = useNavigate(); // <--- Hook de navegação iniciado
  
  const [bio, setBio] = useState(currentBio || "");
  const [username, setUsername] = useState(currentUsername || "");
  const [nickname, setNickname] = useState(currentNickname || ""); 
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);
  
  const [steamUrl, setSteamUrl] = useState("");
  const [xboxUrl, setXboxUrl] = useState("");
  const [psnUrl, setPsnUrl] = useState("");
  const [epicUrl, setEpicUrl] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
        setBio(currentBio || "");
        setUsername(currentUsername || "");
        setNickname(currentNickname || currentUsername || ""); 
        // Reset previews se não tiver mudado
        if (currentSocial) {
          setSteamUrl(currentSocial.steam || "");
          setXboxUrl(currentSocial.xbox || "");
          setPsnUrl(currentSocial.psn || "");
          setEpicUrl(currentSocial.epic || "");
        }
    }
  }, [currentBio, currentUsername, currentNickname, currentSocial, open]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { 
        toast.error("A imagem deve ter menos de 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const userId = localStorage.getItem("userId");
    
    const updateData: any = { 
      user_id: userId, 
      username, 
      nickname,
      bio,
      steam_url: steamUrl,
      xbox_url: xboxUrl,
      psn_url: psnUrl,
      epic_url: epicUrl
    };

    if (avatarPreview) updateData.avatar_url = avatarPreview;
    if (selectedBanner) updateData.banner_url = selectedBanner;

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const resData = await response.json();

      if (response.ok) {
        toast.success("Perfil atualizado com sucesso!");
        localStorage.setItem("username", username);
        
        // --- CORREÇÃO AQUI ---
        // Se o username mudou, precisamos forçar a mudança na URL do navegador
        if (username !== currentUsername) {
            navigate(`/profile/${username}`); 
            // O navigate vai desmontar o Profile atual e montar o novo, carregando os dados certos
        } else {
            // Se o username é o mesmo, apenas atualizamos os dados na tela atual
            onProfileUpdate(); 
        }
        
        onOpenChange(false);
      } else {
        toast.error(resData.detail || "Erro ao atualizar perfil.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-[#0A0A0A] border border-white/10 text-white p-0 overflow-hidden shadow-2xl">
        
        {/* HEADER CUSTOMIZADO COM PREVIEW */}
        <div className="relative h-32 w-full bg-gray-900 overflow-hidden group">
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ 
                    backgroundImage: `url(${selectedBanner || banner1})`,
                    opacity: 0.6
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
            
            <div className="absolute bottom-4 left-6 flex items-end gap-4 z-10">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-[#0A0A0A] bg-black overflow-hidden shadow-lg">
                        <img 
                            src={avatarPreview || defaultProfileImg} 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-black rounded-full p-1 border-2 border-[#0A0A0A]">
                        <ImageIcon className="w-3 h-3" />
                    </div>
                </div>
                <div className="mb-2">
                    <h2 className="text-xl font-bold text-white leading-none mb-1">{nickname || "Seu Nickname"}</h2>
                    <p className="text-xs text-gray-400">@{username || "usuario"}</p>
                </div>
            </div>

            <DialogTitle className="absolute top-4 left-4 text-white/50 text-xs font-pixel tracking-widest uppercase">
                EDITANDO PERFIL
            </DialogTitle>
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
                <X className="w-5 h-5" />
            </Button>
        </div>
        
        <div className="p-6 pt-2">
            <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full bg-[#121214] border border-white/5 p-1 mb-6 rounded-lg">
                <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                    <User className="w-4 h-4 mr-2" /> Info Pessoal
                </TabsTrigger>
                <TabsTrigger value="social" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                    <LinkIcon className="w-4 h-4 mr-2" /> Conexões
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                    <ImageIcon className="w-4 h-4 mr-2" /> Aparência
                </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[300px] pr-4">
                {/* ABA INFO */}
                <TabsContent value="info" className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Login (Único)</Label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    className="pl-9 bg-[#121214] border-white/10 focus:border-primary/50"
                                    placeholder="usuario123"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Nickname (Exibição)</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input 
                                    value={nickname} 
                                    onChange={(e) => setNickname(e.target.value)} 
                                    className="pl-9 bg-[#121214] border-white/10 focus:border-primary/50"
                                    placeholder="Pro Gamer"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Bio / Sobre Mim</Label>
                        <Textarea 
                            value={bio} 
                            onChange={(e) => setBio(e.target.value)} 
                            className="bg-[#121214] border-white/10 min-h-[100px] resize-none focus:border-primary/50"
                            placeholder="Escreva algo épico sobre sua jornada gamer..."
                            maxLength={300}
                        />
                        <p className="text-right text-[10px] text-gray-600">{bio.length}/300</p>
                    </div>
                </TabsContent>

                {/* ABA SOCIAL */}
                <TabsContent value="social" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20 text-xs text-blue-300 mb-4">
                        Adicione os links dos seus perfis para aparecerem no seu cartão social.
                    </div>

                    {[
                        { label: "Steam Profile", icon: <Gamepad2 className={`w-4 h-4 ${SOCIAL_COLORS.steam}`} />, val: steamUrl, set: setSteamUrl, ph: "https://steamcommunity.com/id/..." },
                        { label: "Xbox Live / Gamertag", icon: <Gamepad2 className={`w-4 h-4 ${SOCIAL_COLORS.xbox}`} />, val: xboxUrl, set: setXboxUrl, ph: "Seu Gamertag ou Link" },
                        { label: "PlayStation Network", icon: <Gamepad2 className={`w-4 h-4 ${SOCIAL_COLORS.psn}`} />, val: psnUrl, set: setPsnUrl, ph: "Sua PSN ID ou Link" },
                        { label: "Epic Games", icon: <Gamepad2 className={`w-4 h-4 ${SOCIAL_COLORS.epic}`} />, val: epicUrl, set: setEpicUrl, ph: "Seu Epic ID" }
                    ].map((item, i) => (
                        <div key={i} className="space-y-1">
                            <Label className="text-xs text-gray-400">{item.label}</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">
                                    {item.icon}
                                </div>
                                <Input 
                                    value={item.val} 
                                    onChange={(e) => item.set(e.target.value)} 
                                    placeholder={item.ph} 
                                    className="pl-9 bg-[#121214] border-white/10 group-focus-within:border-white/30 transition-all" 
                                />
                            </div>
                        </div>
                    ))}
                </TabsContent>

                {/* ABA APARÊNCIA */}
                <TabsContent value="appearance" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {/* Upload Avatar */}
                    <div className="flex items-center gap-6 bg-[#121214] p-4 rounded-xl border border-white/5">
                        <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-600 group-hover:border-primary transition-colors">
                                <img src={avatarPreview || defaultProfileImg} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <Input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">Foto de Perfil</h4>
                            <p className="text-xs text-gray-500 mb-2">Recomendado: 400x400px (Max 2MB)</p>
                            <Button size="sm" variant="secondary" className="h-8 text-xs relative overflow-hidden">
                                <Input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                Escolher Arquivo
                            </Button>
                        </div>
                    </div>

                    {/* Seleção de Banner */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Escolha um Banner</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {presetBanners.map((banner, index) => (
                                <div
                                key={index}
                                onClick={() => setSelectedBanner(banner)}
                                className={`cursor-pointer relative h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 group ${
                                    selectedBanner === banner ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-transparent hover:border-white/30'
                                }`}
                                >
                                <img src={banner} className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all" />
                                {selectedBanner === banner && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="bg-primary rounded-full p-1">
                                            <Save className="w-3 h-3 text-black" />
                                        </div>
                                    </div>
                                )}
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </ScrollArea>
            </Tabs>
        </div>

        <DialogFooter className="p-6 pt-2 bg-[#0A0A0A] border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white hover:bg-white/5">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-primary text-black font-bold hover:bg-primary/80 min-w-[140px]">
            {loading ? <span className="animate-pulse">Salvando...</span> : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};