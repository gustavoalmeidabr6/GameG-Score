import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Image, Palette, Upload, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock preset backgrounds
const presetBackgrounds = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&h=1080&fit=crop",
];

const presetBanners = [
  "https://images.unsplash.com/photo-1511882150382-421056c89033?w=1920&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&h=400&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&h=400&fit=crop",
];

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop");
  const [selectedBanner, setSelectedBanner] = useState(presetBanners[0]);
  const [selectedBackground, setSelectedBackground] = useState(presetBackgrounds[0]);
  const [isPremium] = useState(false); // Simulating free user

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality with file upload
    console.log("Saving profile changes:", { avatarFile, selectedBanner, selectedBackground });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary uppercase tracking-wider font-pixel">
            Editar Perfil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Personalize seu perfil. Avatar é totalmente gratuito!
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="avatar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-panel">
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
          </TabsList>

          {/* Avatar Tab - FREE */}
          <TabsContent value="avatar" className="space-y-4">
            <div className="space-y-4">
              <Label htmlFor="avatar-upload" className="text-primary uppercase tracking-wider text-xs font-bold flex items-center gap-2">
                <User className="h-4 w-4" />
                Foto de Perfil (Grátis)
              </Label>
              
              <div className="flex flex-col items-center gap-4">
                {avatarPreview && (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-32 h-32 rounded-full border-4 border-primary/50 object-cover"
                  />
                )}
                
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="glass-panel border-2 border-dashed border-primary/30 hover:border-primary/50 rounded-xl p-6 text-center transition-all">
                    <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-primary font-medium">Clique para fazer upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</p>
                  </div>
                </label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </TabsContent>

          {/* Banner Tab - FREEMIUM */}
          <TabsContent value="banner" className="space-y-4">
            <div className="space-y-4">
              <Label className="text-primary uppercase tracking-wider text-xs font-bold flex items-center gap-2">
                <Image className="h-4 w-4" />
                Banner do Perfil
              </Label>
              
              {/* Presets Grid */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Escolha um dos nossos presets gratuitos:</p>
                <div className="grid grid-cols-2 gap-3">
                  {presetBanners.map((banner, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedBanner(banner)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedBanner === banner ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]' : 'border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <img src={banner} alt={`Preset ${index + 1}`} className="w-full h-20 object-cover" />
                      {selectedBanner === banner && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-background rounded-full p-1">
                            <User className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Upload Locked */}
              <div className="relative">
                <div className="glass-panel border-2 border-dashed border-primary/20 rounded-xl p-6 text-center opacity-50">
                  <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Upload Personalizado</p>
                  <p className="text-xs text-muted-foreground mt-1">Recurso Premium</p>
                </div>
                {!isPremium && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                      Upgrade para Premium
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Background Tab - FREEMIUM */}
          <TabsContent value="background" className="space-y-4">
            <div className="space-y-4">
              <Label className="text-primary uppercase tracking-wider text-xs font-bold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Background Geral
              </Label>
              
              {/* Presets Grid */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Escolha um dos nossos presets gratuitos:</p>
                <div className="grid grid-cols-2 gap-3">
                  {presetBackgrounds.map((bg, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedBackground(bg)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedBackground === bg ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]' : 'border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <img src={bg} alt={`Preset ${index + 1}`} className="w-full h-24 object-cover" />
                      {selectedBackground === bg && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-background rounded-full p-1">
                            <User className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Upload Locked */}
              <div className="relative">
                <div className="glass-panel border-2 border-dashed border-primary/20 rounded-xl p-6 text-center opacity-50">
                  <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Upload Personalizado</p>
                  <p className="text-xs text-muted-foreground mt-1">Recurso Premium</p>
                </div>
                {!isPremium && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                      Upgrade para Premium
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-primary/30 text-foreground hover:bg-primary/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-background font-pixel text-xs uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
