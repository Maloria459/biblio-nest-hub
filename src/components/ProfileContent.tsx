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
    <div className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[180px] mx-auto w-full">
      <div className="aspect-[2/3] w-full bg-muted overflow-hidden">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <FileText className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-bold leading-tight line-clamp-2">{book.title}</p>
        <p className="text-[11px] text-muted-foreground">{book.author}</p>
        {book.rating != null && book.rating > 0 && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-2.5 w-2.5 ${book.rating! >= s ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
              />
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
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data as ProfileData);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if (data.banner_url) setBannerUrl(data.banner_url);
        }
      });
  }, [user, setAvatarUrl]);

  const uploadImage = useCallback(
    async (file: File, bucket: string, field: "avatar_url" | "banner_url") => {
      if (!user) return;
      setUploading(true);
      try {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${field}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        await supabase
          .from("profiles")
          .update({ [field]: publicUrl })
          .eq("id", user.id);
        if (field === "avatar_url") setAvatarUrl(publicUrl);
        else setBannerUrl(publicUrl);
        toast.success(field === "avatar_url" ? "Photo de profil mise à jour !" : "Bannière mise à jour !");
      } catch (err: any) {
        toast.error(err.message || "Erreur lors de l'upload");
      } finally {
        setUploading(false);
      }
    },
    [user, setAvatarUrl],
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "avatars", "avatar_url");
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "banners", "banner_url");
  };

  if (!user) return null;

  const recommandations = books.filter((b) => b.isRecommended);
  const coupsDeCoeur = books.filter((b) => b.isFavorite);
  const publicationCount = 0;
  const followingCount = 0;
  const followerCount = 0;

  const points = books.length * 10;
  const rankTitle =
    points < 50
      ? "Lecteur curieux"
      : points < 150
        ? "Lecteur assidu"
        : points < 300
          ? "Bibliophile"
          : "Rat de bibliothèque";
  const progressPercent = Math.min((points / 300) * 100, 100);

  const registrationDate = profile?.created_at
    ? format(new Date(profile.created_at), "d MMMM yyyy", { locale: fr })
    : "—";

  const isOwnProfile = true;
  const visibleTabs = isOwnProfile ? ALL_TABS : ALL_TABS.filter((t) => !t.isPrivate);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* BANNER + PROFILE HEADER */}
      <div className="relative w-full">
        {/* Banner */}
        <div className="relative w-full h-44 md:h-56 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {bannerUrl && <img src={bannerUrl} alt="Bannière" className="w-full h-full object-cover absolute inset-0" />}
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleBannerChange}
          />
        </div>
      </div>

      {/* PROFILE INFO BAR */}
      <div className="relative flex flex-col md:flex-row items-center md:items-end gap-4 px-4 md:px-8 py-4 bg-gradient-to-b from-black/60 to-black/30 -mt-20 z-10">
        {/* Avatar */}
        <div className="relative group">
          <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
            <AvatarFallback>
              <User className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
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
          <EmptyState
            icon="📝"
            title="Aucune publication pour le moment"
            subtitle="Vos publications dans le fil d'actualité apparaîtront ici."
          />
        )}
        {activeTab === "recommandations" &&
          (recommandations.length === 0 ? (
            <EmptyState
              icon="⭐"
              title="Aucune recommandation pour le moment"
              subtitle="Marquez un livre comme 'Recommandation du mois' dans sa fiche de lecture pour qu'il apparaisse ici."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {recommandations.map((book) => (
                <ProfileBookCard key={book.id} book={book} />
              ))}
            </div>
          ))}
        {activeTab === "coups" &&
          (coupsDeCoeur.length === 0 ? (
            <EmptyState
              icon="❤️"
              title="Aucun coup de cœur pour le moment"
              subtitle="Marquez un livre comme 'Coup de cœur' dans sa fiche de lecture pour qu'il apparaisse ici."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {coupsDeCoeur.map((book) => (
                <ProfileBookCard key={book.id} book={book} />
              ))}
            </div>
          ))}
        {activeTab === "saved" && (
          <EmptyState
            icon="🔖"
            title="Aucune publication enregistrée"
            subtitle="Enregistrez des publications depuis le fil d'actualité pour les retrouver ici."
          />
        )}
        {activeTab === "liked" && (
          <EmptyState
            icon="👍"
            title="Aucune publication aimée"
            subtitle="Aimez des publications depuis le fil d'actualité pour les retrouver ici."
          />
        )}
      </div>
    </div>
  );
}
