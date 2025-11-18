import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Image as ImageIcon, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBio?: string;
  onProfileUpdate: () => void;
}

// Presets de Banner (URLs públicas)
const presetBanners = [
  "https://images.unsplash.com/photo-1511882150382-421056c89033?w=1920&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&h=400&fit=crop",
  "https://images.unsplash.com/photo-1614726365723-49cfae56242d?w=1920&h=400&fit=crop",
];

export const EditProfileDialog = ({ open, onOpenChange, currentBio, onProfileUpdate }: EditProfileDialogProps) => {
  const [bio, setBio] = useState(currentBio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Função para converter arquivo em Base64
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // Limite de 2MB (Strings base64 são grandes!)
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
    
    const updateData: any = { user_id: userId, bio };
    if (avatarPreview) updateData.avatar_url = avatarPreview;
    if (selectedBanner) updateData.banner_url = selectedBanner;

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success("Perfil atualizado!");
        onProfileUpdate(); // Atualiza a tela de perfil
        onOpenChange(false);
      } else {
        toast.error("Erro ao atualizar perfil.");
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
          <TabsList className="grid w-full grid-cols-3 bg-black/50">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
          </TabsList>

          {/* ABA INFO (BIO) */}
          <TabsContent value="info" className="space-y-4 py-4">
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

          {/* ABA AVATAR (UPLOAD) */}
          <TabsContent value="avatar" className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-32 h-32 rounded-full border-4 border-primary object-cover" />
              ) : (
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                  <User className="text-gray-500 w-12 h-12" />
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

          {/* ABA BANNER (PRESETS) */}
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