import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { useBooks } from "@/contexts/BooksContext";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Star, User, Pencil, ImageIcon, FileText, Heart, Bookmark, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProfileData {
  pseudo: string;
  created_at: string;
  avatar_url: string | null;
  banner_url: string | null;
}

function ProfileBookCard({ book }: { book: any }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[2/3] w-full bg-muted overflow-hidden">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="p-1.5 space-y-0.5">
        <p className="text-xs font-bold leading-tight line-clamp-2">{book.title}</p>
        <p className="text-[10px] text-muted-foreground">{book.author}</p>
        {book.rating != null && book.rating > 0 && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-2.5 w-2.5 ${book.rating! >= s ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{subtitle}</p>
    </div>
  );
}

function StatCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg md:text-xl font-bold text-white">{value}</span>
      <span className="text-[11px] md:text-xs text-white/70">{label}</span>
    </div>
  );
}

type TabKey = "publications" | "recommandations" | "coups" | "saved" | "liked";

const ALL_TABS: { key: TabKey; icon: React.ReactNode; tooltip: string; isPrivate: boolean }[] = [
  { key: "publications", icon: <FileText className="h-5 w-5" />, tooltip: "Mes publications", isPrivate: false },
  { key: "recommandations", icon: <Star className="h-5 w-5" />, tooltip: "Mes recommandations", isPrivate: false },
  { key: "coups", icon: <Heart className="h-5 w-5" />, tooltip: "Mes coups de cœur", isPrivate: false },
  { key: "saved", icon: <Bookmark className="h-5 w-5" />, tooltip: "Mes publications enregistrées", isPrivate: true },
  { key: "liked", icon: <ThumbsUp className="h-5 w-5" />, tooltip: "Mes publications aimées", isPrivate: true },
];

export function ProfileContent() {
  const { user } = useAuth();
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const { books } = useBooks();
  

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("publications");
  const [uploading, setUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("pseudo, created_at, avatar_url, banner_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as ProfileData);
          if (data.avatar_url) setAvatarUrl(data.avatar_url as string);
          if (data.banner_url) setBannerUrl(data.banner_url as string);
        }
      });
  }, [user?.id]);

  const uploadImage = useCallback(
    async (file: File, bucket: string, maxMB: number) => {
      if (!user) return null;
      if (file.size > maxMB * 1024 * 1024) {
        toast.error(`Le fichier dépasse ${maxMB} Mo`);
        return null;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error || !data) {
        toast.error("Erreur lors de l'upload");
        return null;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return urlData.publicUrl;
    },
    [user]
  );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadImage(file, "avatars", 2);
    if (url) {
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url } as any).eq("user_id", user.id);
      toast.success("Avatar mis à jour");
      
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadImage(file, "profile-banners", 5);
    if (url) {
      setBannerUrl(url);
      await supabase.from("profiles").update({ banner_url: url } as any).eq("user_id", user.id);
      toast.success("Bannière mise à jour");
      checkProgression("upload_banner");
    }
    setUploading(false);
    e.target.value = "";
  };

  const recommandations = books.filter((b) => b.recommandationDuMois);
  const coupsDeCoeur = books.filter((b) => b.coupDeCoeur && !b.recommandationDuMois);
  const registrationDate = profile?.created_at
    ? format(new Date(profile.created_at), "dd/MM/yyyy", { locale: fr })
    : "—";

  const rankTitle = "Lecteur Débutant";
  const points = 0;
  const progressPercent = 0;
  const publicationCount = 0;
  const followingCount = 0;
  const followerCount = 0;

  const isOwnProfile = true;
  const visibleTabs = isOwnProfile ? ALL_TABS : ALL_TABS.filter((t) => !t.isPrivate);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* BANNER */}
      <div
        className="relative w-full min-h-[220px] md:min-h-[250px] flex flex-col md:flex-row items-center md:items-center px-6 md:px-10 py-8 gap-6"
        style={{
          background: bannerUrl
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${bannerUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, hsl(0 0% 30%), hsl(0 0% 15%))",
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white h-8 w-8 transition-colors"
              disabled={uploading}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Modifier la bannière</TooltipContent>
        </Tooltip>
        <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerChange} />

        {/* LEFT ZONE */}
        <div className="flex flex-col md:flex-row items-center gap-5 flex-shrink-0">
          <div className="relative">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-[3px] border-white shadow-lg">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white h-7 w-7 transition-colors border-2 border-white"
                  disabled={uploading}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Modifier l'avatar</TooltipContent>
            </Tooltip>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex flex-col items-center md:items-start gap-1">
            <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow truncate max-w-[260px]">
              {profile?.pseudo || "—"}
            </h1>
            <span className="text-sm text-white/80">📖 {rankTitle}</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-[180px] md:w-[200px] h-2 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs font-bold text-white">{points} pts</span>
            </div>
            <span className="text-xs text-white/60 mt-0.5">Membre depuis le {registrationDate}</span>
          </div>
        </div>

        {/* RIGHT ZONE */}
        <div className="flex flex-wrap justify-center md:justify-end gap-5 md:gap-8 md:ml-auto">
          <StatCounter value={publicationCount} label="Publications" />
          <StatCounter value={recommandations.length} label="Recommandations" />
          <StatCounter value={coupsDeCoeur.length} label="Coups de cœur" />
          <StatCounter value={followingCount} label="Suivis" />
          <StatCounter value={followerCount} label="Abonnés" />
        </div>
      </div>

      {/* TABS BAR */}
      <div className="flex items-center justify-center border-b border-border bg-card">
        {visibleTabs.map((tab) => (
          <Tooltip key={tab.key}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center py-3 transition-colors border-b-[3px] ${
                  activeTab === tab.key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>{tab.tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 p-4 md:p-6">
        {activeTab === "publications" && (
          <EmptyState icon="📝" title="Aucune publication pour le moment" subtitle="Vos publications dans le fil d'actualité apparaîtront ici." />
        )}
        {activeTab === "recommandations" && (
          recommandations.length === 0 ? (
            <EmptyState icon="⭐" title="Aucune recommandation pour le moment" subtitle="Marquez un livre comme 'Recommandation du mois' dans sa fiche de lecture pour qu'il apparaisse ici." />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {recommandations.map((book) => <ProfileBookCard key={book.id} book={book} />)}
            </div>
          )
        )}
        {activeTab === "coups" && (
          coupsDeCoeur.length === 0 ? (
            <EmptyState icon="❤️" title="Aucun coup de cœur pour le moment" subtitle="Marquez un livre comme 'Coup de cœur' dans sa fiche de lecture pour qu'il apparaisse ici." />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {coupsDeCoeur.map((book) => <ProfileBookCard key={book.id} book={book} />)}
            </div>
          )
        )}
        {activeTab === "saved" && (
          <EmptyState icon="🔖" title="Aucune publication enregistrée" subtitle="Enregistrez des publications depuis le fil d'actualité pour les retrouver ici." />
        )}
        {activeTab === "liked" && (
          <EmptyState icon="👍" title="Aucune publication aimée" subtitle="Aimez des publications depuis le fil d'actualité pour les retrouver ici." />
        )}
      </div>
    </div>
  );
}
