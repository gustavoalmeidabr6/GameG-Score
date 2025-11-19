import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Upload, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// --- IMPORTANDO OS NOVOS ASSETS LOCAIS ---
import banner1 from "@/assets/BANNER1.png";
import banner2 from "@/assets/BANNER2.png";
import banner3 from "@/assets/BANNER3.png";
import banner4 from "@/assets/BANNER4.png";
import defaultProfileImg from "@/assets/defaultprofile.png";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBio?: string;
  currentUsername?: string;
  currentNickname?: string; 
  currentSocial?: { steam?: string, xbox?: string, psn?: string, epic?: string };
  onProfileUpdate: () => void;
}

// Agora usamos as imagens importadas
const presetBanners = [banner1, banner2, banner3, banner4];

export const EditProfileDialog = ({ open, onOpenChange, currentBio, currentUsername, currentNickname, currentSocial, onProfileUpdate }: EditProfileDialogProps) => {
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
    setBio(currentBio || "");
    setUsername(currentUsername || "");
    setNickname(currentNickname || currentUsername || ""); 
    if (currentSocial) {
      setSteamUrl(currentSocial.steam || "");
      setXboxUrl(currentSocial.xbox || "");
      setPsnUrl(currentSocial.psn || "");
      setEpicUrl(currentSocial.epic || "");
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
        toast.success("Perfil atualizado!");
        localStorage.setItem("username", username);
        onProfileUpdate(); 
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
      <DialogContent className="sm:max-w-[600px] bg-[#1a1c1f] border-primary/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary uppercase tracking-wider font-pixel">
            Editar Perfil
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/50">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome de Usuário (Login)</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="bg-black/30 border-gray-700 text-white"
                placeholder="Seu login"
              />
            </div>
            <div className="space-y-2">
              <Label>Nick de Perfil (Exibição)</Label>
              <Input 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)} 
                className="bg-black/30 border-gray-700 text-white"
                placeholder="Como você quer ser chamado"
              />
            </div>
            <div className="space-y-2">
              <Label>Bio / Sobre Mim</Label>
              <Textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                className="bg-black/30 border-gray-700 text-white min-h-[100px]"
                placeholder="Conte um pouco sobre você..."
              />
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Link Steam</Label>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <Input value={steamUrl} onChange={(e) => setSteamUrl(e.target.value)} placeholder="https://steamcommunity.com/id/seu-perfil" className="bg-black/30" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Link Xbox</Label>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <Input value={xboxUrl} onChange={(e) => setXboxUrl(e.target.value)} placeholder="https://xbox.com/..." className="bg-black/30" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Link PSN</Label>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <Input value={psnUrl} onChange={(e) => setPsnUrl(e.target.value)} placeholder="https://my.playstation.com/..." className="bg-black/30" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Link Epic Games</Label>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <Input value={epicUrl} onChange={(e) => setEpicUrl(e.target.value)} placeholder="Seu link ou user" className="bg-black/30" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-32 h-32 rounded-full border-4 border-primary object-cover" />
              ) : (
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                   {/* Mostra o Default se não tiver preview */}
                   <img src={defaultProfileImg} className="w-full h-full rounded-full opacity-50" />
                </div>
              )}
              
              <label className="cursor-pointer">
                <div className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 px-4 py-2 rounded-md flex items-center gap-2 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Foto (PC)</span>
                </div>
                <Input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              <p className="text-xs text-gray-500">Máximo 2MB (JPG/PNG)</p>
            </div>
          </TabsContent>

          <TabsContent value="banner" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {presetBanners.map((banner, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedBanner(banner)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedBanner === banner ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img src={banner} className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-primary text-black font-bold hover:bg-primary/80">
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};